package service

type Page[TItem any] struct {
	Items []TItem `json:"items"`
	Total int     `json:"total"`
}
