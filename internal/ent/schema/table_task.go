package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type TableTask struct {
	ent.Schema
}

// TableTask holds the schema definition for the TableTask entity.
func (TableTask) Fields() []ent.Field {
	return []ent.Field{
		field.String("id").StructTag(`json:"taskId"`).Unique().Immutable(),
		field.String("schemaName").StructTag(`json:"schemaName"`),
		field.String("tableName").StructTag(`json:"tableName"`),
		field.String("primaryKeyColumn").StructTag(`json:"primaryKeyColumn"`),
		field.Int("batchSize").StructTag(`json:"batchSize"`),
		field.Int("totalRows").StructTag(`json:"totalRows"`).Default(0),
		field.Int("processedRows").StructTag(`json:"processedRows"`).Default(0),
		field.String("status").StructTag(`json:"status"`).Default("pending"),
		field.String("lastCheckpoint").StructTag(`json:"lastCheckpoint"`).Optional().Nillable(),
		field.String("errorMessage").StructTag(`json:"errorMessage"`).Optional().Nillable(),
		field.Time("startedAt").StructTag(`json:"startedAt"`).Optional().Nillable(),
		field.Time("finishedAt").StructTag(`json:"finishedAt"`).Optional().Nillable(),
		field.Time("createdAt").StructTag(`json:"createdAt"`).Default(time.Now).Immutable(),
		field.Time("updatedAt").StructTag(`json:"updatedAt"`).Default(time.Now).UpdateDefault(time.Now),
	}
}

// Edges of the TableTask.
func (TableTask) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("job", Job.Type).Ref("tasks").Unique().Required(),
	}
}
