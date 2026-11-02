package service

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/CoronelV/Stewrd/internal/domain"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/logger"
)

const (
	syncRecordsJobName   = "Sync records"
	syncRecordsBatchSize = 500
)

// syncColumnMeta describes a column of a table as needed by the insert-only sync.
type syncColumnMeta struct {
	name      string
	isPrimary bool
	generated bool
}

// syncSide groups the connection role, schema and database handle of one end of a sync.
type syncSide struct {
	role   string // "source" | "target"
	schema string
	db     *sql.DB
}

// StartSyncRecords launches a background job that copies the rows which exist on the origin side
// (according to the requested direction) but are missing on the destination side. It never updates
// nor deletes existing records: rows are written with INSERT IGNORE, so key collisions are skipped.
func (s *jobService) StartSyncRecords(ctx context.Context, req domain.SyncRecordsRequest) (*domain.RunningJobInfo, error) {
	req.SourceSchema = strings.TrimSpace(req.SourceSchema)
	req.TargetSchema = strings.TrimSpace(req.TargetSchema)
	req.Table = strings.TrimSpace(req.Table)
	req.Direction = strings.ToLower(strings.TrimSpace(req.Direction))

	if req.SourceSchema == "" || req.TargetSchema == "" || req.Table == "" {
		return nil, appErrors.New(appErrors.CodeValidation, "sourceSchema, targetSchema and table are required", nil)
	}
	if req.Direction != domain.SyncDirectionSourceToTarget && req.Direction != domain.SyncDirectionTargetToSource {
		return nil, appErrors.New(appErrors.CodeValidation, fmt.Sprintf("invalid sync direction '%s'", req.Direction), nil)
	}

	s.mu.Lock()
	if s.activeJob != nil && s.activeJob.Status == "running" {
		s.mu.Unlock()
		return nil, appErrors.New(appErrors.CodeConflict, "another job is already running", nil)
	}

	jobId := fmt.Sprintf("sync-%d", time.Now().UnixNano())
	jobInfo := &domain.RunningJobInfo{
		JobId:  jobId,
		Name:   fmt.Sprintf("%s (%s → %s: %s)", syncRecordsJobName, directionOriginRole(req.Direction), directionDestinationRole(req.Direction), req.Table),
		Status: "running",
		JobStats: domain.RunningJobStats{
			Eta:   "calculating...",
			Phase: "Comparing keys",
		},
		SourceConnection: domain.ConnectionStats{Speed: "-- MB/s", Latency: "-- ms"},
		TargetConnection: domain.ConnectionStats{Speed: "-- MB/s", Latency: "-- ms"},
	}
	s.activeJob = jobInfo

	jobCtx, jobCancel := context.WithCancel(context.Background())
	s.cancelFn = jobCancel
	copyJob := *jobInfo
	s.mu.Unlock()

	go func() {
		defer jobCancel()
		s.runSyncRecordsPipeline(jobCtx, jobId, req)
	}()

	return &copyJob, nil
}

func directionOriginRole(direction string) string {
	if direction == domain.SyncDirectionTargetToSource {
		return "target"
	}
	return "source"
}

func directionDestinationRole(direction string) string {
	if direction == domain.SyncDirectionTargetToSource {
		return "source"
	}
	return "target"
}

// updateJob applies fn to the active job only if it is still the job identified by jobId.
func (s *jobService) updateJob(jobId string, fn func(job *domain.RunningJobInfo)) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.activeJob != nil && s.activeJob.JobId == jobId {
		fn(s.activeJob)
	}
}

func (s *jobService) runSyncRecordsPipeline(ctx context.Context, jobId string, req domain.SyncRecordsRequest) {
	log := s.deps.Logger

	failJob := func(err error) {
		if ctx.Err() != nil {
			// Cancelled by the user: CancelActiveJob already updated the status.
			return
		}
		log.Error("sync records failed", err)
		errMsg := err.Error()
		s.updateJob(jobId, func(job *domain.RunningJobInfo) {
			job.Status = "failed"
			job.JobStats.Phase = "Failed"
			job.JobStats.Errors++
			job.ErrorMessage = &errMsg
		})
	}

	sourceDb, sourceCloser, err := s.deps.ConnectionService.OpenSession(ctx, "source")
	if err != nil {
		failJob(fmt.Errorf("source db connection failed: %w", err))
		return
	}
	if sourceCloser != nil {
		defer sourceCloser.Close()
	}
	defer sourceDb.Close()

	targetDb, targetCloser, err := s.deps.ConnectionService.OpenSession(ctx, "target")
	if err != nil {
		failJob(fmt.Errorf("target db connection failed: %w", err))
		return
	}
	if targetCloser != nil {
		defer targetCloser.Close()
	}
	defer targetDb.Close()

	sourceSide := syncSide{role: "source", schema: req.SourceSchema, db: sourceDb}
	targetSide := syncSide{role: "target", schema: req.TargetSchema, db: targetDb}
	origin, destination := sourceSide, targetSide
	if req.Direction == domain.SyncDirectionTargetToSource {
		origin, destination = targetSide, sourceSide
	}

	// 1. Resolve columns on both sides
	originCols, err := loadSyncColumns(ctx, origin.db, origin.schema, req.Table)
	if err != nil {
		failJob(fmt.Errorf("failed to read %s table columns: %w", origin.role, err))
		return
	}
	destCols, err := loadSyncColumns(ctx, destination.db, destination.schema, req.Table)
	if err != nil {
		failJob(fmt.Errorf("failed to read %s table columns: %w", destination.role, err))
		return
	}
	if len(originCols) == 0 {
		failJob(fmt.Errorf("table '%s' does not exist in %s schema '%s'", req.Table, origin.role, origin.schema))
		return
	}
	if len(destCols) == 0 {
		failJob(fmt.Errorf("table '%s' does not exist in %s schema '%s'; only new records can be inserted into existing tables", req.Table, destination.role, destination.schema))
		return
	}

	destColMap := make(map[string]syncColumnMeta, len(destCols))
	for _, c := range destCols {
		destColMap[c.name] = c
	}
	insertColumns := make([]string, 0, len(originCols))
	for _, c := range originCols {
		if dc, ok := destColMap[c.name]; ok && !dc.generated && !c.generated {
			insertColumns = append(insertColumns, c.name)
		}
	}
	if len(insertColumns) == 0 {
		failJob(fmt.Errorf("table '%s' has no writable columns shared between source and target", req.Table))
		return
	}

	// 2. Resolve the uniqueness criteria (must exist on both sides)
	uniqueKeys := resolveSyncUniqueKeys(req.UniqueKeys, originCols, destCols, destColMap, insertColumns)
	if len(uniqueKeys) == 0 {
		failJob(fmt.Errorf("could not determine unique key columns for table '%s'", req.Table))
		return
	}

	// 3. Compute the keys missing on the destination
	originKeys, err := fetchKeysAndHashes(ctx, origin.db, origin.schema, req.Table, uniqueKeys, nil, 0)
	if err != nil {
		failJob(fmt.Errorf("failed to read %s keys: %w", origin.role, err))
		return
	}
	destKeys, err := fetchKeysAndHashes(ctx, destination.db, destination.schema, req.Table, uniqueKeys, nil, 0)
	if err != nil {
		failJob(fmt.Errorf("failed to read %s keys: %w", destination.role, err))
		return
	}

	existing := make(map[string]struct{}, len(destKeys))
	for _, k := range destKeys {
		existing[k.keyCompare] = struct{}{}
	}
	destKeys = nil

	missing := make([]map[string]any, 0)
	seen := make(map[string]struct{})
	var selected map[string]struct{}
	if len(req.RowKeys) > 0 {
		selected = make(map[string]struct{}, len(req.RowKeys))
		for _, rk := range req.RowKeys {
			selected[rk] = struct{}{}
		}
	}
	for _, k := range originKeys {
		if _, ok := existing[k.keyCompare]; ok {
			continue
		}
		if selected != nil {
			if _, ok := selected[k.keyCompare]; !ok {
				continue
			}
		}
		if _, dup := seen[k.keyCompare]; dup {
			continue
		}
		seen[k.keyCompare] = struct{}{}
		missing = append(missing, k.keyValues)
	}
	originKeys = nil

	totalMissing := int64(len(missing))
	s.updateJob(jobId, func(job *domain.RunningJobInfo) {
		job.JobStats.Phase = fmt.Sprintf("Inserting into %s", destination.role)
		job.JobStats.RecordsToSync = totalMissing
	})

	// 4. Insert missing rows in batches (INSERT IGNORE: never updates existing rows)
	quotedCols := make([]string, len(insertColumns))
	for i, c := range insertColumns {
		quotedCols[i] = fmt.Sprintf("`%s`", c)
	}
	colsList := strings.Join(quotedCols, ", ")
	rowPlaceholder := "(" + strings.TrimSuffix(strings.Repeat("?,", len(insertColumns)), ",") + ")"

	startTime := time.Now()
	var processed, inserted int64

	for start := 0; start < len(missing); start += syncRecordsBatchSize {
		if ctx.Err() != nil {
			return
		}
		end := start + syncRecordsBatchSize
		if end > len(missing) {
			end = len(missing)
		}
		batchKeys := missing[start:end]

		rowsByKey, err := fetchRowsByKeys(ctx, origin.db, origin.schema, req.Table, uniqueKeys, batchKeys)
		if err != nil {
			failJob(fmt.Errorf("failed to read rows from %s: %w", origin.role, err))
			return
		}

		placeholders := make([]string, 0, len(rowsByKey))
		args := make([]any, 0, len(rowsByKey)*len(insertColumns))
		for _, row := range rowsByKey {
			placeholders = append(placeholders, rowPlaceholder)
			for _, c := range insertColumns {
				args = append(args, row[c])
			}
		}

		if len(placeholders) > 0 {
			insertSQL := fmt.Sprintf("INSERT IGNORE INTO `%s`.`%s` (%s) VALUES %s",
				destination.schema, req.Table, colsList, strings.Join(placeholders, ","))
			res, err := destination.db.ExecContext(ctx, insertSQL, args...)
			if err != nil {
				failJob(fmt.Errorf("failed to insert records into %s: %w", destination.role, err))
				return
			}
			if affected, err := res.RowsAffected(); err == nil {
				inserted += affected
			}
		}

		processed += int64(len(batchKeys))
		progress, throughput, eta := computeJobProgress(processed, totalMissing, startTime)
		s.updateJob(jobId, func(job *domain.RunningJobInfo) {
			job.JobStats.RecordsSynced = processed
			job.JobStats.Progress = progress
			job.JobStats.Throughput = throughput
			job.JobStats.Eta = eta
		})
	}

	// 5. Completed
	skipped := totalMissing - inserted
	var resultMsg string
	if totalMissing == 0 {
		resultMsg = fmt.Sprintf("No missing records found: every %s row of '%s' already exists in %s.", origin.role, req.Table, destination.role)
	} else {
		resultMsg = fmt.Sprintf("Inserted %d new record(s) into %s `%s`.`%s`.", inserted, destination.role, destination.schema, req.Table)
		if skipped > 0 {
			resultMsg += fmt.Sprintf(" %d record(s) skipped (key collision or constraint violation).", skipped)
		}
	}

	s.updateJob(jobId, func(job *domain.RunningJobInfo) {
		job.Status = "completed"
		job.JobStats.Phase = "Completed"
		job.JobStats.Progress = 100
		job.JobStats.RecordsSynced = totalMissing
		job.JobStats.Eta = "0s"
		job.ResultMessage = &resultMsg
	})
	log.Info("sync records completed",
		logger.Field{Key: "table", Value: req.Table},
		logger.Field{Key: "direction", Value: req.Direction},
		logger.Field{Key: "inserted", Value: inserted},
		logger.Field{Key: "skipped", Value: skipped},
	)
}

// computeJobProgress returns the progress percentage, throughput (records/s) and ETA label.
func computeJobProgress(done, total int64, startTime time.Time) (int, int64, string) {
	throughput := int64(0)
	if elapsed := time.Since(startTime).Seconds(); elapsed > 0 {
		throughput = int64(float64(done) / elapsed)
	}
	progress := 100
	eta := "calculating..."
	if total > 0 {
		progress = int((done * 100) / total)
		if throughput > 0 {
			remSec := (total - done) / throughput
			eta = fmt.Sprintf("%dm %ds", remSec/60, remSec%60)
		}
	}
	return progress, throughput, eta
}

func loadSyncColumns(ctx context.Context, db *sql.DB, schema, table string) ([]syncColumnMeta, error) {
	rows, err := db.QueryContext(ctx, `
		SELECT COLUMN_NAME, COLUMN_KEY, EXTRA
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
		ORDER BY ORDINAL_POSITION`, schema, table)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cols := make([]syncColumnMeta, 0)
	for rows.Next() {
		var name, colKey, extra string
		if err := rows.Scan(&name, &colKey, &extra); err != nil {
			return nil, err
		}
		upperExtra := strings.ToUpper(extra)
		cols = append(cols, syncColumnMeta{
			name:      name,
			isPrimary: strings.EqualFold(colKey, "PRI"),
			// "DEFAULT_GENERATED" (e.g. DEFAULT CURRENT_TIMESTAMP) is writable; only virtual/stored generated columns are not.
			generated: strings.Contains(upperExtra, "VIRTUAL GENERATED") || strings.Contains(upperExtra, "STORED GENERATED"),
		})
	}
	return cols, rows.Err()
}

// resolveSyncUniqueKeys mirrors the comparison logic: requested keys present on both sides,
// otherwise the origin primary key, otherwise the destination primary key, otherwise the first shared column.
func resolveSyncUniqueKeys(requested []string, originCols, destCols []syncColumnMeta, destColMap map[string]syncColumnMeta, sharedColumns []string) []string {
	originSet := make(map[string]bool, len(originCols))
	for _, c := range originCols {
		originSet[c.name] = true
	}
	inBoth := func(col string) bool {
		_, inDest := destColMap[col]
		return originSet[col] && inDest
	}

	keys := make([]string, 0)
	for _, k := range requested {
		k = strings.TrimSpace(k)
		if k != "" && inBoth(k) {
			keys = append(keys, k)
		}
	}
	if len(keys) > 0 {
		return keys
	}

	for _, c := range originCols {
		if c.isPrimary && inBoth(c.name) {
			keys = append(keys, c.name)
		}
	}
	if len(keys) > 0 {
		return keys
	}

	for _, c := range destCols {
		if c.isPrimary && originSet[c.name] {
			keys = append(keys, c.name)
		}
	}
	if len(keys) > 0 {
		return keys
	}

	if len(sharedColumns) > 0 {
		return []string{sharedColumns[0]}
	}
	return keys
}
