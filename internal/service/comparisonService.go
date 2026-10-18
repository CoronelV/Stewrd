package service

import (
	"context"
	"database/sql"
	"fmt"
	"sort"
	"strings"

	"github.com/CoronelV/Stewrd/internal/domain"
	appErrors "github.com/CoronelV/Stewrd/internal/errors"
	"github.com/CoronelV/Stewrd/internal/logger"
)

type ComparisonService interface {
	GetCommonSchemas(ctx context.Context) (*domain.CommonSchemasResponse, error)
	ValidateSchemas(ctx context.Context, sourceSchema, targetSchema string) (*domain.SchemaValidationResponse, error)
	GetTablesOverview(ctx context.Context, sourceSchema, targetSchema string) (*domain.TableComparisonOverviewResponse, error)
	CompareData(ctx context.Context, req domain.ComparisonDataRequest) (*domain.ComparisonDataResponse, error)
}

type comparisonService struct {
	connections ConnectionService
	logger      logger.Logger
}

var _ ComparisonService = (*comparisonService)(nil)

func NewComparisonService(connections ConnectionService, log logger.Logger) ComparisonService {
	return &comparisonService{
		connections: connections,
		logger:      log,
	}
}

func (s *comparisonService) GetCommonSchemas(ctx context.Context) (*domain.CommonSchemasResponse, error) {
	sourceActiveInfo, _ := s.connections.GetActiveConnection(ctx, "source")
	targetActiveInfo, _ := s.connections.GetActiveConnection(ctx, "target")

	resp := &domain.CommonSchemasResponse{
		Schemas:       make([]string, 0),
		SourceSchemas: make([]string, 0),
		TargetSchemas: make([]string, 0),
		SourceActive:  sourceActiveInfo != nil && sourceActiveInfo.Status == "active",
		TargetActive:  targetActiveInfo != nil && targetActiveInfo.Status == "active",
	}

	if resp.SourceActive {
		sourceDB, sourceTun, err := s.connections.OpenSession(ctx, "source")
		if err != nil {
			s.logger.Error("failed to open source session for schemas", err)
		} else {
			if sourceTun != nil {
				defer sourceTun.Close()
			}
			defer sourceDB.Close()
			if list, err := s.listUserSchemas(ctx, sourceDB); err == nil {
				resp.SourceSchemas = list
			} else {
				s.logger.Error("failed to list source schemas", err)
			}
		}
	}

	if resp.TargetActive {
		targetDB, targetTun, err := s.connections.OpenSession(ctx, "target")
		if err != nil {
			s.logger.Error("failed to open target session for schemas", err)
		} else {
			if targetTun != nil {
				defer targetTun.Close()
			}
			defer targetDB.Close()
			if list, err := s.listUserSchemas(ctx, targetDB); err == nil {
				resp.TargetSchemas = list
			} else {
				s.logger.Error("failed to list target schemas", err)
			}
		}
	}

	targetMap := make(map[string]string)
	for _, ts := range resp.TargetSchemas {
		targetMap[strings.ToLower(ts)] = ts
	}

	common := make([]string, 0)
	for _, ss := range resp.SourceSchemas {
		if matched, exists := targetMap[strings.ToLower(ss)]; exists {
			common = append(common, matched)
		}
	}
	sort.Strings(common)
	resp.Schemas = common
	return resp, nil
}

func (s *comparisonService) listUserSchemas(ctx context.Context, db *sql.DB) ([]string, error) {
	query := `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA 
	          WHERE SCHEMA_NAME NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys') 
	          ORDER BY SCHEMA_NAME`
	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	schemas := make([]string, 0)
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err == nil {
			schemas = append(schemas, name)
		}
	}
	return schemas, rows.Err()
}

func (s *comparisonService) ValidateSchemas(ctx context.Context, sourceSchema, targetSchema string) (*domain.SchemaValidationResponse, error) {
	cleanSource := strings.TrimSpace(sourceSchema)
	cleanTarget := strings.TrimSpace(targetSchema)
	if cleanSource == "" || cleanTarget == "" {
		return nil, appErrors.New(appErrors.CodeValidation, "both sourceSchema and targetSchema are required", nil)
	}

	sourceDB, sourceTun, err := s.connections.OpenSession(ctx, "source")
	if err != nil {
		return nil, appErrors.New(appErrors.CodeConnection, "failed to connect to source database", err)
	}
	if sourceTun != nil {
		defer sourceTun.Close()
	}
	defer sourceDB.Close()

	targetDB, targetTun, err := s.connections.OpenSession(ctx, "target")
	if err != nil {
		return nil, appErrors.New(appErrors.CodeConnection, "failed to connect to target database", err)
	}
	if targetTun != nil {
		defer targetTun.Close()
	}
	defer targetDB.Close()

	var sourceExists, targetExists int
	_ = sourceDB.QueryRowContext(ctx, "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?", cleanSource).Scan(&sourceExists)
	_ = targetDB.QueryRowContext(ctx, "SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?", cleanTarget).Scan(&targetExists)

	if sourceExists == 0 || targetExists == 0 {
		msg := ""
		if sourceExists == 0 && targetExists == 0 {
			msg = fmt.Sprintf("Neither source schema '%s' nor target schema '%s' exists.", cleanSource, cleanTarget)
		} else if sourceExists == 0 {
			msg = fmt.Sprintf("Source schema '%s' does not exist in the source database.", cleanSource)
		} else {
			msg = fmt.Sprintf("Target schema '%s' does not exist in the target database.", cleanTarget)
		}
		return &domain.SchemaValidationResponse{
			SourceSchema: cleanSource,
			TargetSchema: cleanTarget,
			Available:    false,
			Status:       "invalid",
			Summary:      msg,
			Tables:       make([]domain.TableSchemaValidationItem, 0),
		}, nil
	}

	sourceTables, err := s.getTablesAndColumns(ctx, sourceDB, cleanSource)
	if err != nil {
		return nil, err
	}
	targetTables, err := s.getTablesAndColumns(ctx, targetDB, cleanTarget)
	if err != nil {
		return nil, err
	}

	allTableNamesMap := make(map[string]bool)
	for t := range sourceTables {
		allTableNamesMap[t] = true
	}
	for t := range targetTables {
		allTableNamesMap[t] = true
	}

	allTableNames := make([]string, 0, len(allTableNamesMap))
	for t := range allTableNamesMap {
		allTableNames = append(allTableNames, t)
	}
	sort.Strings(allTableNames)

	tables := make([]domain.TableSchemaValidationItem, 0, len(allTableNames))
	commonTables := 0
	compatibleTables := 0
	columnMismatchTables := 0
	missingInTargetCount := 0
	missingInSourceCount := 0

	for _, tblName := range allTableNames {
		sInfo, inSource := sourceTables[tblName]
		tInfo, inTarget := targetTables[tblName]

		item := domain.TableSchemaValidationItem{
			TableName:         tblName,
			ExistsInSource:    inSource,
			ExistsInTarget:    inTarget,
			SourceColumnCount: len(sInfo.columns),
			TargetColumnCount: len(tInfo.columns),
			CommonColumns:     make([]string, 0),
			MissingInTarget:   make([]string, 0),
			MissingInSource:   make([]string, 0),
			TypeMismatches:    make([]string, 0),
		}

		if inSource && !inTarget {
			item.Compatible = false
			item.Status = "missing_in_target"
			item.MissingInTarget = sInfo.columns
			missingInTargetCount++
		} else if !inSource && inTarget {
			item.Compatible = false
			item.Status = "missing_in_source"
			item.MissingInSource = tInfo.columns
			missingInSourceCount++
		} else {
			commonTables++
			sColMap := make(map[string]string)
			for _, c := range sInfo.columns {
				sColMap[c] = sInfo.columnTypes[c]
			}
			tColMap := make(map[string]string)
			for _, c := range tInfo.columns {
				tColMap[c] = tInfo.columnTypes[c]
			}

			for _, c := range sInfo.columns {
				if tType, ok := tColMap[c]; ok {
					item.CommonColumns = append(item.CommonColumns, c)
					sType := sColMap[c]
					if !strings.EqualFold(sType, tType) {
						item.TypeMismatches = append(item.TypeMismatches, fmt.Sprintf("%s (%s vs %s)", c, sType, tType))
					}
				} else {
					item.MissingInTarget = append(item.MissingInTarget, c)
				}
			}

			for _, c := range tInfo.columns {
				if _, ok := sColMap[c]; !ok {
					item.MissingInSource = append(item.MissingInSource, c)
				}
			}

			if len(item.MissingInTarget) == 0 && len(item.MissingInSource) == 0 && len(item.TypeMismatches) == 0 {
				item.Compatible = true
				item.Status = "compatible"
				compatibleTables++
			} else {
				// Still available to compare on common columns if at least one common column exists
				item.Compatible = len(item.CommonColumns) > 0
				item.Status = "column_mismatch"
				columnMismatchTables++
			}
		}

		tables = append(tables, item)
	}

	available := len(allTableNames) > 0 && (len(sourceTables) > 0 || len(targetTables) > 0)
	status := "valid"
	var summary string

	if len(sourceTables) == 0 && len(targetTables) == 0 {
		available = false
		status = "invalid"
		summary = fmt.Sprintf("Both source schema '%s' and target schema '%s' have 0 tables.", cleanSource, cleanTarget)
	} else if commonTables == 0 {
		available = true
		status = "warning"
		summary = fmt.Sprintf("Schemas '%s' and '%s' have no tables with matching names (%d only in source, %d only in target).", cleanSource, cleanTarget, missingInTargetCount, missingInSourceCount)
	} else if missingInTargetCount > 0 || missingInSourceCount > 0 || columnMismatchTables > 0 {
		available = true
		status = "warning"
		summary = fmt.Sprintf("Schemas '%s' and '%s' are available to compare (%d shared table(s): %d fully matching, %d with column differences; %d missing in target, %d missing in source).",
			cleanSource, cleanTarget, commonTables, compatibleTables, columnMismatchTables, missingInTargetCount, missingInSourceCount)
	} else {
		available = true
		status = "valid"
		summary = fmt.Sprintf("Schemas '%s' and '%s' are structurally identical (%d matching table(s)) and ready for data comparison.", cleanSource, cleanTarget, compatibleTables)
	}

	return &domain.SchemaValidationResponse{
		SourceSchema:         cleanSource,
		TargetSchema:         cleanTarget,
		Available:            available,
		Status:               status,
		Summary:              summary,
		TotalTables:          len(allTableNames),
		CommonTables:         commonTables,
		CompatibleTables:     compatibleTables,
		ColumnMismatchTables: columnMismatchTables,
		MissingInTargetCount: missingInTargetCount,
		MissingInSourceCount: missingInSourceCount,
		Tables:               tables,
	}, nil
}

func (s *comparisonService) GetTablesOverview(ctx context.Context, sourceSchema, targetSchema string) (*domain.TableComparisonOverviewResponse, error) {
	cleanSource := strings.TrimSpace(sourceSchema)
	cleanTarget := strings.TrimSpace(targetSchema)
	if cleanSource == "" && cleanTarget != "" {
		cleanSource = cleanTarget
	}
	if cleanTarget == "" && cleanSource != "" {
		cleanTarget = cleanSource
	}
	if cleanSource == "" || cleanTarget == "" {
		return nil, appErrors.New(appErrors.CodeValidation, "source and target schema names are required", nil)
	}

	sourceDB, sourceTun, err := s.connections.OpenSession(ctx, "source")
	if err != nil {
		return nil, appErrors.New(appErrors.CodeConnection, "failed to connect to source database", err)
	}
	if sourceTun != nil {
		defer sourceTun.Close()
	}
	defer sourceDB.Close()

	targetDB, targetTun, err := s.connections.OpenSession(ctx, "target")
	if err != nil {
		return nil, appErrors.New(appErrors.CodeConnection, "failed to connect to target database", err)
	}
	if targetTun != nil {
		defer targetTun.Close()
	}
	defer targetDB.Close()

	sourceTables, err := s.getTablesAndColumns(ctx, sourceDB, cleanSource)
	if err != nil {
		return nil, err
	}
	targetTables, err := s.getTablesAndColumns(ctx, targetDB, cleanTarget)
	if err != nil {
		return nil, err
	}

	allTableNamesMap := make(map[string]bool)
	for t := range sourceTables {
		allTableNamesMap[t] = true
	}
	for t := range targetTables {
		allTableNamesMap[t] = true
	}

	allTableNames := make([]string, 0, len(allTableNamesMap))
	for t := range allTableNamesMap {
		allTableNames = append(allTableNames, t)
	}
	sort.Strings(allTableNames)

	overviewItems := make([]domain.TableOverviewItem, 0, len(allTableNames))
	for _, tableName := range allTableNames {
		item := domain.TableOverviewItem{
			TableName:      tableName,
			SourceCount:    -1,
			TargetCount:    -1,
			ExistsInSource: false,
			ExistsInTarget: false,
			PrimaryKeys:    make([]string, 0),
			Columns:        make([]string, 0),
		}

		sInfo, inSource := sourceTables[tableName]
		tInfo, inTarget := targetTables[tableName]

		item.ExistsInSource = inSource
		item.ExistsInTarget = inTarget

		if inSource {
			item.Columns = sInfo.columns
			item.PrimaryKeys = sInfo.primaryKeys
			var count int64
			countErr := sourceDB.QueryRowContext(ctx, fmt.Sprintf("SELECT COUNT(*) FROM `%s`.`%s`", cleanSource, tableName)).Scan(&count)
			if countErr == nil {
				item.SourceCount = count
			}
		}
		if inTarget {
			if len(item.Columns) == 0 {
				item.Columns = tInfo.columns
				item.PrimaryKeys = tInfo.primaryKeys
			}
			var count int64
			countErr := targetDB.QueryRowContext(ctx, fmt.Sprintf("SELECT COUNT(*) FROM `%s`.`%s`", cleanTarget, tableName)).Scan(&count)
			if countErr == nil {
				item.TargetCount = count
			}
		}

		overviewItems = append(overviewItems, item)
	}

	return &domain.TableComparisonOverviewResponse{
		Schema:       cleanSource,
		SourceSchema: cleanSource,
		TargetSchema: cleanTarget,
		Tables:       overviewItems,
	}, nil
}

type tableMeta struct {
	columns     []string
	primaryKeys []string
	columnTypes map[string]string
}

func (s *comparisonService) getTablesAndColumns(ctx context.Context, db *sql.DB, schema string) (map[string]tableMeta, error) {
	query := `
		SELECT TABLE_NAME, COLUMN_NAME, COLUMN_KEY, DATA_TYPE 
		FROM information_schema.COLUMNS 
		WHERE TABLE_SCHEMA = ? 
		ORDER BY TABLE_NAME, ORDINAL_POSITION`

	rows, err := db.QueryContext(ctx, query, schema)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]tableMeta)
	for rows.Next() {
		var tbl, col, colKey, dataType string
		if err := rows.Scan(&tbl, &col, &colKey, &dataType); err != nil {
			return nil, err
		}
		meta := result[tbl]
		if meta.columnTypes == nil {
			meta.columnTypes = make(map[string]string)
		}
		meta.columns = append(meta.columns, col)
		meta.columnTypes[col] = strings.ToLower(dataType)
		if strings.EqualFold(colKey, "PRI") {
			meta.primaryKeys = append(meta.primaryKeys, col)
		}
		result[tbl] = meta
	}
	return result, rows.Err()
}

type keyHashItem struct {
	keyValues  map[string]any
	keyCompare string
	rowHash    string
}

type diffResultItem struct {
	keyValues  map[string]any
	keyCompare string
	status     string // "only_source" | "only_target" | "different"
}

func cleanSqlValue(v any) any {
	if v == nil {
		return nil
	}
	if b, ok := v.([]byte); ok {
		return string(b)
	}
	return v
}

func (s *comparisonService) CompareData(ctx context.Context, req domain.ComparisonDataRequest) (*domain.ComparisonDataResponse, error) {
	sourceSchema := strings.TrimSpace(req.SourceSchema)
	targetSchema := strings.TrimSpace(req.TargetSchema)
	legacySchema := strings.TrimSpace(req.Schema)

	if sourceSchema == "" {
		sourceSchema = legacySchema
	}
	if targetSchema == "" {
		targetSchema = legacySchema
	}
	if sourceSchema == "" && targetSchema != "" {
		sourceSchema = targetSchema
	}
	if targetSchema == "" && sourceSchema != "" {
		targetSchema = sourceSchema
	}

	table := strings.TrimSpace(req.Table)
	if sourceSchema == "" || targetSchema == "" || table == "" {
		return nil, appErrors.New(appErrors.CodeValidation, "sourceSchema, targetSchema, and table are required", nil)
	}

	limit := req.Limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	offset := req.Offset
	if offset < 0 {
		offset = 0
	}

	filter := strings.ToLower(strings.TrimSpace(req.Filter))
	if filter == "" {
		filter = "differences"
	}

	sourceDB, sourceTun, err := s.connections.OpenSession(ctx, "source")
	if err != nil {
		return nil, appErrors.New(appErrors.CodeConnection, "failed to connect to source database", err)
	}
	if sourceTun != nil {
		defer sourceTun.Close()
	}
	defer sourceDB.Close()

	targetDB, targetTun, err := s.connections.OpenSession(ctx, "target")
	if err != nil {
		return nil, appErrors.New(appErrors.CodeConnection, "failed to connect to target database", err)
	}
	if targetTun != nil {
		defer targetTun.Close()
	}
	defer targetDB.Close()

	sourceMeta, err := s.getTablesAndColumns(ctx, sourceDB, sourceSchema)
	if err != nil {
		return nil, err
	}
	targetMeta, err := s.getTablesAndColumns(ctx, targetDB, targetSchema)
	if err != nil {
		return nil, err
	}

	sTbl, sourceHasTable := sourceMeta[table]
	tTbl, targetHasTable := targetMeta[table]

	if !sourceHasTable && !targetHasTable {
		return nil, appErrors.New(appErrors.CodeValidation, fmt.Sprintf("table '%s' does not exist in source or target", table), nil)
	}

	// Columns union / available columns
	columnSet := make(map[string]bool)
	allColumns := make([]string, 0)
	for _, c := range sTbl.columns {
		if !columnSet[c] {
			columnSet[c] = true
			allColumns = append(allColumns, c)
		}
	}
	for _, c := range tTbl.columns {
		if !columnSet[c] {
			columnSet[c] = true
			allColumns = append(allColumns, c)
		}
	}

	// Determine unique keys
	uniqueKeys := make([]string, 0)
	for _, k := range req.UniqueKeys {
		kClean := strings.TrimSpace(k)
		if kClean != "" && columnSet[kClean] {
			uniqueKeys = append(uniqueKeys, kClean)
		}
	}
	if len(uniqueKeys) == 0 {
		if len(sTbl.primaryKeys) > 0 {
			uniqueKeys = sTbl.primaryKeys
		} else if len(tTbl.primaryKeys) > 0 {
			uniqueKeys = tTbl.primaryKeys
		} else if len(allColumns) > 0 {
			uniqueKeys = []string{allColumns[0]}
		}
	}

	// Common columns across both tables to compare values
	commonColumns := make([]string, 0)
	sColSet := make(map[string]bool)
	for _, c := range sTbl.columns {
		sColSet[c] = true
	}
	for _, c := range tTbl.columns {
		if sColSet[c] {
			commonColumns = append(commonColumns, c)
		}
	}

	var sourceTotal, targetTotal int64
	if sourceHasTable {
		_ = sourceDB.QueryRowContext(ctx, fmt.Sprintf("SELECT COUNT(*) FROM `%s`.`%s`", sourceSchema, table)).Scan(&sourceTotal)
	}
	if targetHasTable {
		_ = targetDB.QueryRowContext(ctx, fmt.Sprintf("SELECT COUNT(*) FROM `%s`.`%s`", targetSchema, table)).Scan(&targetTotal)
	}

	// If table only exists on one side
	if !sourceHasTable || !targetHasTable {
		return s.handleMissingTableSide(ctx, sourceSchema, targetSchema, table, allColumns, uniqueKeys, filter, offset, limit, sourceHasTable, targetHasTable, sourceTotal, targetTotal, sourceDB, targetDB)
	}

	// Ensure uniqueKeys exist in both source and target tables when both tables exist
	tColSet := make(map[string]bool)
	for _, c := range tTbl.columns {
		tColSet[c] = true
	}
	validCommonKeys := make([]string, 0, len(uniqueKeys))
	for _, k := range uniqueKeys {
		if sColSet[k] && tColSet[k] {
			validCommonKeys = append(validCommonKeys, k)
		}
	}
	if len(validCommonKeys) == 0 {
		if len(commonColumns) > 0 {
			validCommonKeys = []string{commonColumns[0]}
		} else {
			return nil, appErrors.New(appErrors.CodeValidation, fmt.Sprintf("table '%s' has no shared columns between source and target schemas", table), nil)
		}
	}
	uniqueKeys = validCommonKeys

	// Fetch keys & row hashes from both databases
	sourceItems, err := s.fetchKeysAndHashes(ctx, sourceDB, sourceSchema, table, uniqueKeys, commonColumns)
	if err != nil {
		return nil, fmt.Errorf("failed fetching source table keys: %w", err)
	}
	targetItems, err := s.fetchKeysAndHashes(ctx, targetDB, targetSchema, table, uniqueKeys, commonColumns)
	if err != nil {
		return nil, fmt.Errorf("failed fetching target table keys: %w", err)
	}

	// Merge diff walk
	var sourceOnlyCount, targetOnlyCount, differentCount, identicalCount int64
	matchingDiffs := make([]diffResultItem, 0)

	i, j := 0, 0
	lenS, lenT := len(sourceItems), len(targetItems)

	for i < lenS && j < lenT {
		cmp := strings.Compare(sourceItems[i].keyCompare, targetItems[j].keyCompare)
		if cmp < 0 {
			// In Source only
			sourceOnlyCount++
			if filter == "only_source" || filter == "differences" {
				matchingDiffs = append(matchingDiffs, diffResultItem{
					keyValues:  sourceItems[i].keyValues,
					keyCompare: sourceItems[i].keyCompare,
					status:     "only_source",
				})
			}
			i++
		} else if cmp > 0 {
			// In Target only
			targetOnlyCount++
			if filter == "only_target" || filter == "differences" {
				matchingDiffs = append(matchingDiffs, diffResultItem{
					keyValues:  targetItems[j].keyValues,
					keyCompare: targetItems[j].keyCompare,
					status:     "only_target",
				})
			}
			j++
		} else {
			// Key exists in both
			if sourceItems[i].rowHash != targetItems[j].rowHash {
				differentCount++
				if filter == "differences" {
					matchingDiffs = append(matchingDiffs, diffResultItem{
						keyValues:  sourceItems[i].keyValues,
						keyCompare: sourceItems[i].keyCompare,
						status:     "different",
					})
				}
			} else {
				identicalCount++
			}
			i++
			j++
		}
	}

	// Remaining items in Source
	for i < lenS {
		sourceOnlyCount++
		if filter == "only_source" || filter == "differences" {
			matchingDiffs = append(matchingDiffs, diffResultItem{
				keyValues:  sourceItems[i].keyValues,
				keyCompare: sourceItems[i].keyCompare,
				status:     "only_source",
			})
		}
		i++
	}

	// Remaining items in Target
	for j < lenT {
		targetOnlyCount++
		if filter == "only_target" || filter == "differences" {
			matchingDiffs = append(matchingDiffs, diffResultItem{
				keyValues:  targetItems[j].keyValues,
				keyCompare: targetItems[j].keyCompare,
				status:     "only_target",
			})
		}
		j++
	}

	totalMatches := len(matchingDiffs)
	stats := domain.ComparisonStats{
		SourceTotal:     sourceTotal,
		TargetTotal:     targetTotal,
		SourceOnlyCount: sourceOnlyCount,
		TargetOnlyCount: targetOnlyCount,
		DifferentCount:  differentCount,
		IdenticalCount:  identicalCount,
	}

	if offset >= totalMatches {
		return &domain.ComparisonDataResponse{
			Schema:       sourceSchema,
			SourceSchema: sourceSchema,
			TargetSchema: targetSchema,
			Table:        table,
			Columns:      allColumns,
			UniqueKeys:   uniqueKeys,
			Filter:       filter,
			Offset:       offset,
			Limit:        limit,
			TotalMatches: totalMatches,
			HasMore:      false,
			Stats:        stats,
			Rows:         make([]domain.ComparisonRow, 0),
		}, nil
	}

	end := offset + limit
	if end > totalMatches {
		end = totalMatches
	}
	pagedDiffs := matchingDiffs[offset:end]
	hasMore := end < totalMatches

	// Group keys for source and target queries
	sourcePageKeys := make([]map[string]any, 0)
	targetPageKeys := make([]map[string]any, 0)

	for _, d := range pagedDiffs {
		if d.status == "only_source" || d.status == "different" {
			sourcePageKeys = append(sourcePageKeys, d.keyValues)
		}
		if d.status == "only_target" || d.status == "different" {
			targetPageKeys = append(targetPageKeys, d.keyValues)
		}
	}

	sourceDataMap, err := s.fetchRowsByKeys(ctx, sourceDB, sourceSchema, table, uniqueKeys, sourcePageKeys)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch page rows from source: %w", err)
	}
	targetDataMap, err := s.fetchRowsByKeys(ctx, targetDB, targetSchema, table, uniqueKeys, targetPageKeys)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch page rows from target: %w", err)
	}

	rows := make([]domain.ComparisonRow, 0, len(pagedDiffs))
	for _, d := range pagedDiffs {
		compRow := domain.ComparisonRow{
			KeyValues:        d.keyValues,
			Status:           d.status,
			DifferingColumns: make([]string, 0),
		}

		if d.status == "only_source" {
			compRow.SourceData = sourceDataMap[d.keyCompare]
			compRow.TargetData = nil
		} else if d.status == "only_target" {
			compRow.SourceData = nil
			compRow.TargetData = targetDataMap[d.keyCompare]
		} else if d.status == "different" {
			sRow := sourceDataMap[d.keyCompare]
			tRow := targetDataMap[d.keyCompare]
			compRow.SourceData = sRow
			compRow.TargetData = tRow

			// Check which columns differ
			for _, col := range allColumns {
				sVal, sOk := sRow[col]
				tVal, tOk := tRow[col]
				if sOk != tOk || !compareValuesEqual(sVal, tVal) {
					compRow.DifferingColumns = append(compRow.DifferingColumns, col)
				}
			}
		}

		rows = append(rows, compRow)
	}

	return &domain.ComparisonDataResponse{
		Schema:       sourceSchema,
		SourceSchema: sourceSchema,
		TargetSchema: targetSchema,
		Table:        table,
		Columns:      allColumns,
		UniqueKeys:   uniqueKeys,
		Filter:       filter,
		Offset:       offset,
		Limit:        limit,
		TotalMatches: totalMatches,
		HasMore:      hasMore,
		Stats:        stats,
		Rows:         rows,
	}, nil
}

func compareValuesEqual(v1, v2 any) bool {
	if v1 == nil && v2 == nil {
		return true
	}
	if v1 == nil || v2 == nil {
		return false
	}
	return fmt.Sprintf("%v", v1) == fmt.Sprintf("%v", v2)
}

func (s *comparisonService) fetchKeysAndHashes(
	ctx context.Context,
	db *sql.DB,
	schema, table string,
	uniqueKeys []string,
	columnsForHash []string,
) ([]keyHashItem, error) {
	quotedKeys := make([]string, len(uniqueKeys))
	for i, k := range uniqueKeys {
		quotedKeys[i] = fmt.Sprintf("`%s`", k)
	}

	var hashExpr string
	if len(columnsForHash) > 0 {
		hashParts := make([]string, len(columnsForHash))
		for i, c := range columnsForHash {
			hashParts[i] = fmt.Sprintf("COALESCE(CAST(`%s` AS CHAR), '§NULL§')", c)
		}
		hashExpr = fmt.Sprintf("MD5(CONCAT_WS('__#SEP#__', %s))", strings.Join(hashParts, ", "))
	} else {
		hashExpr = "MD5('empty')"
	}

	query := fmt.Sprintf("SELECT %s, %s AS row_hash FROM `%s`.`%s` ORDER BY %s LIMIT 100000",
		strings.Join(quotedKeys, ", "),
		hashExpr,
		schema,
		table,
		strings.Join(quotedKeys, ", "),
	)

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	keyCount := len(uniqueKeys)
	colCount := keyCount + 1

	items := make([]keyHashItem, 0)
	for rows.Next() {
		vals := make([]any, colCount)
		ptrs := make([]any, colCount)
		for idx := range vals {
			ptrs[idx] = &vals[idx]
		}

		if err := rows.Scan(ptrs...); err != nil {
			return nil, err
		}

		keyMap := make(map[string]any, keyCount)
		compareParts := make([]string, keyCount)

		for kIdx, kName := range uniqueKeys {
			cleanVal := cleanSqlValue(vals[kIdx])
			keyMap[kName] = cleanVal
			compareParts[kIdx] = fmt.Sprintf("%v", cleanVal)
		}

		hashVal := ""
		if h := cleanSqlValue(vals[keyCount]); h != nil {
			hashVal = fmt.Sprintf("%v", h)
		}

		items = append(items, keyHashItem{
			keyValues:  keyMap,
			keyCompare: strings.Join(compareParts, "\x00"),
			rowHash:    hashVal,
		})
	}

	return items, rows.Err()
}

func (s *comparisonService) fetchRowsByKeys(
	ctx context.Context,
	db *sql.DB,
	schema, table string,
	uniqueKeys []string,
	pageKeys []map[string]any,
) (map[string]map[string]any, error) {
	result := make(map[string]map[string]any)
	if len(pageKeys) == 0 {
		return result, nil
	}

	var whereClause string
	args := make([]any, 0, len(pageKeys)*len(uniqueKeys))

	if len(uniqueKeys) == 1 {
		k := uniqueKeys[0]
		placeholders := make([]string, len(pageKeys))
		for i, pk := range pageKeys {
			placeholders[i] = "?"
			args = append(args, pk[k])
		}
		whereClause = fmt.Sprintf("`%s` IN (%s)", k, strings.Join(placeholders, ","))
	} else {
		// Composite keys: (`k1` = ? AND `k2` = ?) OR (`k1` = ? AND `k2` = ?)
		orParts := make([]string, len(pageKeys))
		for i, pk := range pageKeys {
			andParts := make([]string, len(uniqueKeys))
			for j, k := range uniqueKeys {
				andParts[j] = fmt.Sprintf("`%s` = ?", k)
				args = append(args, pk[k])
			}
			orParts[i] = "(" + strings.Join(andParts, " AND ") + ")"
		}
		whereClause = strings.Join(orParts, " OR ")
	}

	query := fmt.Sprintf("SELECT * FROM `%s`.`%s` WHERE %s", schema, table, whereClause)
	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	colCount := len(cols)
	for rows.Next() {
		vals := make([]any, colCount)
		ptrs := make([]any, colCount)
		for idx := range vals {
			ptrs[idx] = &vals[idx]
		}
		if err := rows.Scan(ptrs...); err != nil {
			return nil, err
		}

		rowMap := make(map[string]any, colCount)
		for idx, colName := range cols {
			rowMap[colName] = cleanSqlValue(vals[idx])
		}

		compareParts := make([]string, len(uniqueKeys))
		for kIdx, kName := range uniqueKeys {
			compareParts[kIdx] = fmt.Sprintf("%v", rowMap[kName])
		}
		keyComp := strings.Join(compareParts, "\x00")
		result[keyComp] = rowMap
	}

	return result, rows.Err()
}

func (s *comparisonService) handleMissingTableSide(
	ctx context.Context,
	sourceSchema, targetSchema, table string,
	allColumns, uniqueKeys []string,
	filter string,
	offset, limit int,
	sourceHasTable, targetHasTable bool,
	sourceTotal, targetTotal int64,
	sourceDB, targetDB *sql.DB,
) (*domain.ComparisonDataResponse, error) {
	activeDB := sourceDB
	activeSchema := sourceSchema
	activeSide := "only_source"
	totalRows := sourceTotal
	if !sourceHasTable {
		activeDB = targetDB
		activeSchema = targetSchema
		activeSide = "only_target"
		totalRows = targetTotal
	}

	stats := domain.ComparisonStats{
		SourceTotal: sourceTotal,
		TargetTotal: targetTotal,
	}
	if activeSide == "only_source" {
		stats.SourceOnlyCount = sourceTotal
	} else {
		stats.TargetOnlyCount = targetTotal
	}

	// Filter match count
	var totalMatches int
	shouldInclude := false
	if filter == "differences" {
		shouldInclude = true
		totalMatches = int(totalRows)
	} else if filter == activeSide {
		shouldInclude = true
		totalMatches = int(totalRows)
	} else {
		totalMatches = 0
	}

	resp := &domain.ComparisonDataResponse{
		Schema:       sourceSchema,
		SourceSchema: sourceSchema,
		TargetSchema: targetSchema,
		Table:        table,
		Columns:      allColumns,
		UniqueKeys:   uniqueKeys,
		Filter:       filter,
		Offset:       offset,
		Limit:        limit,
		TotalMatches: totalMatches,
		HasMore:      false,
		Stats:        stats,
		Rows:         make([]domain.ComparisonRow, 0),
	}

	if !shouldInclude || offset >= totalMatches {
		return resp, nil
	}

	orderKeys := make([]string, len(uniqueKeys))
	for i, k := range uniqueKeys {
		orderKeys[i] = fmt.Sprintf("`%s`", k)
	}
	orderClause := strings.Join(orderKeys, ", ")
	if orderClause == "" {
		orderClause = "1"
	}

	query := fmt.Sprintf("SELECT * FROM `%s`.`%s` ORDER BY %s LIMIT %d OFFSET %d",
		activeSchema, table, orderClause, limit, offset)

	rows, err := activeDB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	colCount := len(cols)

	for rows.Next() {
		vals := make([]any, colCount)
		ptrs := make([]any, colCount)
		for idx := range vals {
			ptrs[idx] = &vals[idx]
		}
		if err := rows.Scan(ptrs...); err != nil {
			return nil, err
		}

		rowMap := make(map[string]any, colCount)
		for idx, colName := range cols {
			rowMap[colName] = cleanSqlValue(vals[idx])
		}

		keyMap := make(map[string]any, len(uniqueKeys))
		for _, k := range uniqueKeys {
			keyMap[k] = rowMap[k]
		}

		compRow := domain.ComparisonRow{
			KeyValues:        keyMap,
			Status:           activeSide,
			DifferingColumns: make([]string, 0),
		}
		if activeSide == "only_source" {
			compRow.SourceData = rowMap
		} else {
			compRow.TargetData = rowMap
		}
		resp.Rows = append(resp.Rows, compRow)
	}

	resp.HasMore = (offset + len(resp.Rows)) < totalMatches
	return resp, nil
}
