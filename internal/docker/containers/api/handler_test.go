package api_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	containerapi "github.com/rivernova/orcahub/internal/docker/containers/api"
	"github.com/rivernova/orcahub/internal/docker/containers/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func init() {
	gin.SetMode(gin.TestMode)
}

type mockService struct{ mock.Mock }

func (m *mockService) List(ctx context.Context) ([]model.Container, error) {
	args := m.Called(ctx)
	return args.Get(0).([]model.Container), args.Error(1)
}
func (m *mockService) Inspect(ctx context.Context, id string) (*model.Container, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Container), args.Error(1)
}
func (m *mockService) Create(ctx context.Context, c model.Container) (*model.Container, error) {
	args := m.Called(ctx, c)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Container), args.Error(1)
}
func (m *mockService) Delete(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}
func (m *mockService) Start(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}
func (m *mockService) Stop(ctx context.Context, id string, timeout *int) error {
	return m.Called(ctx, id, timeout).Error(0)
}
func (m *mockService) Restart(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}
func (m *mockService) Logs(ctx context.Context, id string, opts model.LogsOptions) ([]string, error) {
	args := m.Called(ctx, id, opts)
	return args.Get(0).([]string), args.Error(1)
}
func (m *mockService) Stats(ctx context.Context, id string) (*model.ContainerStats, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ContainerStats), args.Error(1)
}
func (m *mockService) Exec(ctx context.Context, id string, opts model.ExecOptions) (*model.ExecResult, error) {
	args := m.Called(ctx, id, opts)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.ExecResult), args.Error(1)
}

func setupRouter(svc *mockService) *gin.Engine {
	r := gin.New()
	h := containerapi.NewHandler(svc)
	r.GET("/containers", h.List)
	r.GET("/containers/:id", h.Inspect)
	r.POST("/containers", h.Create)
	r.DELETE("/containers/:id", h.Delete)
	r.POST("/containers/:id/start", h.Start)
	r.POST("/containers/:id/stop", h.Stop)
	r.POST("/containers/:id/restart", h.Restart)
	r.GET("/containers/:id/logs", h.Logs)
	r.GET("/containers/:id/stats", h.Stats)
	r.POST("/containers/:id/exec", h.Exec)
	return r
}

func TestHandler_List_OK(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)

	svc.On("List", mock.Anything).Return([]model.Container{
		{ID: "abc", Name: "app1", State: "running"},
		{ID: "def", Name: "app2", State: "exited"},
	}, nil)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/containers", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Len(t, resp, 2)
	assert.Equal(t, "abc", resp[0]["id"])
}

func TestHandler_List_ServiceError(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)

	svc.On("List", mock.Anything).Return([]model.Container{}, errors.New("daemon down"))

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/containers", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestHandler_Inspect_OK(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)

	svc.On("Inspect", mock.Anything, "abc123").Return(
		&model.Container{ID: "abc123", Name: "my-app", State: "running"}, nil,
	)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/containers/abc123", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "abc123", resp["id"])
}

func TestHandler_Inspect_NotFound(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)

	svc.On("Inspect", mock.Anything, "notexist").Return(nil, errors.New("container not found"))

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/containers/notexist", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

// --- Create ---

func TestHandler_Create_OK(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)

	svc.On("Create", mock.Anything, mock.AnythingOfType("model.Container")).
		Return(&model.Container{ID: "newid"}, nil)

	body, _ := json.Marshal(map[string]interface{}{
		"name":  "my-app",
		"image": "nginx:latest",
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/containers", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "newid", resp["id"])
}

func TestHandler_Create_BadRequest(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/containers", bytes.NewBufferString("invalid json"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestHandler_Delete_OK(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)

	svc.On("Delete", mock.Anything, "abc123").Return(nil)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodDelete, "/containers/abc123", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
}

func TestHandler_Start_OK(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)
	svc.On("Start", mock.Anything, "abc123").Return(nil)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/containers/abc123/start", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_Stop_OK(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)
	svc.On("Stop", mock.Anything, "abc123", mock.Anything).Return(nil)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/containers/abc123/stop", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_Restart_OK(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)
	svc.On("Restart", mock.Anything, "abc123").Return(nil)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/containers/abc123/restart", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestHandler_Logs_OK(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)

	svc.On("Logs", mock.Anything, "abc123", mock.AnythingOfType("model.LogsOptions")).
		Return([]string{"line1", "line2"}, nil)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/containers/abc123/logs?tail=100", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NotNil(t, resp["logs"])
}

func TestHandler_Stats_OK(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)

	svc.On("Stats", mock.Anything, "abc123").Return(
		&model.ContainerStats{CPUPercent: 3.5, MemoryUsage: 1024}, nil,
	)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/containers/abc123/stats", nil)
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, 3.5, resp["cpu_percent"])
}

func TestHandler_Exec_OK(t *testing.T) {
	svc := &mockService{}
	r := setupRouter(svc)

	svc.On("Exec", mock.Anything, "abc123", mock.AnythingOfType("model.ExecOptions")).
		Return(&model.ExecResult{Output: "hello\n", ExitCode: 0}, nil)

	body, _ := json.Marshal(map[string]interface{}{
		"command":       []string{"echo", "hello"},
		"attach_stdout": true,
	})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/containers/abc123/exec", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, float64(0), resp["exit_code"])
}
