package domain

type CommonSchemasResponse struct {
	Schemas       []string `json:"schemas"`
	SourceSchemas []string `json:"sourceSchemas"`
	TargetSchemas []string `json:"targetSchemas"`
	SourceActive  bool     `json:"sourceActive"`
	TargetActive  bool     `json:"targetActive"`
}

type TableSchemaValidationItem struct {
	TableName         string   `json:"tableName"`
	ExistsInSource    bool     `json:"existsInSource"`
	ExistsInTarget    bool     `json:"existsInTarget"`
	Compatible        bool     `json:"compatible"`
	Status            string   `json:"status"` // "compatible" | "column_mismatch" | "missing_in_target" | "missing_in_source"
	SourceColumnCount int      `json:"sourceColumnCount"`
	TargetColumnCount int      `json:"targetColumnCount"`
	CommonColumns     []string `json:"commonColumns"`
	MissingInTarget   []string `json:"missingInTarget"`
	MissingInSource   []string `json:"missingInSource"`
	TypeMismatches    []string `json:"typeMismatches"`
}

type SchemaValidationResponse struct {
	SourceSchema         string                      `json:"sourceSchema"`
	TargetSchema         string                      `json:"targetSchema"`
	Available            bool                        `json:"available"`
	Status               string                      `json:"status"` // "valid" | "warning" | "invalid"
	Summary              string                      `json:"summary"`
	TotalTables          int                         `json:"totalTables"`
	CommonTables         int                         `json:"commonTables"`
	CompatibleTables     int                         `json:"compatibleTables"`
	ColumnMismatchTables int                         `json:"columnMismatchTables"`
	MissingInTargetCount int                         `json:"missingInTargetCount"`
	MissingInSourceCount int                         `json:"missingInSourceCount"`
	Tables               []TableSchemaValidationItem `json:"tables"`
}

type TableOverviewItem struct {
	TableName      string   `json:"tableName"`
	SourceCount    int64    `json:"sourceCount"`
	TargetCount    int64    `json:"targetCount"`
	ExistsInSource bool     `json:"existsInSource"`
	ExistsInTarget bool     `json:"existsInTarget"`
	PrimaryKeys    []string `json:"primaryKeys"`
	Columns        []string `json:"columns"`
}

type TableComparisonOverviewResponse struct {
	Schema       string              `json:"schema"`
	SourceSchema string              `json:"sourceSchema"`
	TargetSchema string              `json:"targetSchema"`
	Tables       []TableOverviewItem `json:"tables"`
}

type ComparisonDataRequest struct {
	Schema       string   `json:"schema"`
	SourceSchema string   `json:"sourceSchema"`
	TargetSchema string   `json:"targetSchema"`
	Table        string   `json:"table"`
	UniqueKeys   []string `json:"uniqueKeys"`
	Filter       string   `json:"filter"` // "differences" | "only_target" | "only_source"
	Limit        int      `json:"limit"`
	Offset       int      `json:"offset"`
}

type ComparisonStats struct {
	SourceTotal     int64 `json:"sourceTotal"`
	TargetTotal     int64 `json:"targetTotal"`
	SourceOnlyCount int64 `json:"sourceOnlyCount"`
	TargetOnlyCount int64 `json:"targetOnlyCount"`
	DifferentCount  int64 `json:"differentCount"`
	IdenticalCount  int64 `json:"identicalCount"`
}

type ComparisonRow struct {
	KeyValues        map[string]any `json:"keyValues"`
	Status           string         `json:"status"` // "only_source" | "only_target" | "different"
	DifferingColumns []string       `json:"differingColumns"`
	SourceData       map[string]any `json:"sourceData"` // nil if only in target
	TargetData       map[string]any `json:"targetData"` // nil if only in source
}

type ComparisonDataResponse struct {
	Schema       string          `json:"schema"`
	SourceSchema string          `json:"sourceSchema"`
	TargetSchema string          `json:"targetSchema"`
	Table        string          `json:"table"`
	Columns      []string        `json:"columns"`
	UniqueKeys   []string        `json:"uniqueKeys"`
	Filter       string          `json:"filter"`
	Offset       int             `json:"offset"`
	Limit        int             `json:"limit"`
	TotalMatches int             `json:"totalMatches"`
	HasMore      bool            `json:"hasMore"`
	Stats        ComparisonStats `json:"stats"`
	Rows         []ComparisonRow `json:"rows"`
}
