package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
)

type Job struct {
	ent.Schema
}

func (Job) Fields() []ent.Field {
	return []ent.Field{
		// ID explícito de tipo string (puedes usar uuid si prefieres)
		field.String("id").StructTag(`json:"jobId"`).Unique().Immutable(),
		field.String("name").StructTag(`json:"name"`).NotEmpty(),
		field.String("description").StructTag(`json:"description"`).Optional(),
		field.String("sourceConnectionName").StructTag(`json:"sourceConnectionName"`),
		field.String("targetConnectionName").StructTag(`json:"targetConnectionName"`),
		field.Time("createdAt").StructTag(`json:"createdAt"`).Default(time.Now).Immutable(),
		field.Time("updatedAt").StructTag(`json:"updatedAt"`).Default(time.Now).UpdateDefault(time.Now),
	}
}

// Edges of the Job.
func (Job) Edges() []ent.Edge {
	return []ent.Edge{
		edge.To("tasks", TableTask.Type),
	}
}
