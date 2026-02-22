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
	volumeapi "github.com/rivernova/orcahub/internal/docker/volumes/api"
	"github.com/rivernova/orcahub/internal/docker/volumes/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func init() { gin.SetMode(gin.TestMode) }

type mockVolumeService struct{ mock.Mock }

func (m *mockVolumeService) List(ctx context.Context) ([]model.Volume, error) {
	args := m.Called(ctx)
	return args.Get(0).([]model.Volume), args.Error(1)
}
func (m *mockVolumeService) Inspect(ctx context.Context, name string) (*model.Volume, error) {
	args := m.Called(ctx, name)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Volume), args.Error(1)
}
func (m *mockVolumeService) Create(ctx context.Context, opts model.CreateVolumeOptions) (*model.Volume, error) {
	args := m.Called(ctx, opts)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Volume), args.Error(1)
}
func (m *mockVolumeService) Delete(ctx context.Context, name string) error {
	return m.Called(ctx, name).Error(0)
}

func setupVolumeRouter(svc *mockVolumeService) *gin.Engine {
	r := gin.New()
	h := volumeapi.NewHandler(svc)
	r.GET("/volumes", h.List)
	r.GET("/volumes/:name", h.Inspect)
	r.POST("/volumes", h.Create)
	r.DELETE("/volumes/:name", h.Delete)
	return r
}

func TestVolumeHandler_List_OK(t *testing.T) {
	svc := &mockVolumeService{}
	r := setupVolumeRouter(svc)

	svc.On("List", mock.Anything).Return([]model.Volume{
		{Name: "postgres-data", Driver: "local"},
	}, nil)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/volumes", nil))

	assert.Equal(t, http.StatusOK, w.Code)
	var resp []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Len(t, resp, 1)
	assert.Equal(t, "postgres-data", resp[0]["name"])
}

func TestVolumeHandler_List_Error(t *testing.T) {
	svc := &mockVolumeService{}
	r := setupVolumeRouter(svc)

	svc.On("List", mock.Anything).Return([]model.Volume{}, errors.New("daemon error"))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/volumes", nil))

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestVolumeHandler_Inspect_OK(t *testing.T) {
	svc := &mockVolumeService{}
	r := setupVolumeRouter(svc)

	svc.On("Inspect", mock.Anything, "postgres-data").Return(
		&model.Volume{Name: "postgres-data", Driver: "local", Mountpoint: "/var/lib/docker/volumes/postgres-data/_data"}, nil,
	)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/volumes/postgres-data", nil))

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "postgres-data", resp["name"])
}

func TestVolumeHandler_Inspect_NotFound(t *testing.T) {
	svc := &mockVolumeService{}
	r := setupVolumeRouter(svc)

	svc.On("Inspect", mock.Anything, "nope").Return(nil, errors.New("volume not found"))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/volumes/nope", nil))

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestVolumeHandler_Create_OK(t *testing.T) {
	svc := &mockVolumeService{}
	r := setupVolumeRouter(svc)

	svc.On("Create", mock.Anything, mock.AnythingOfType("model.CreateVolumeOptions")).
		Return(&model.Volume{Name: "my-vol", Driver: "local"}, nil)

	body, _ := json.Marshal(map[string]string{"name": "my-vol"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/volumes", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "my-vol", resp["name"])
}

func TestVolumeHandler_Create_BadRequest(t *testing.T) {
	svc := &mockVolumeService{}
	r := setupVolumeRouter(svc)

	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/volumes", bytes.NewBufferString("bad json"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestVolumeHandler_Delete_OK(t *testing.T) {
	svc := &mockVolumeService{}
	r := setupVolumeRouter(svc)

	svc.On("Delete", mock.Anything, "my-vol").Return(nil)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/volumes/my-vol", nil))

	assert.Equal(t, http.StatusNoContent, w.Code)
}

func TestVolumeHandler_Delete_Error(t *testing.T) {
	svc := &mockVolumeService{}
	r := setupVolumeRouter(svc)

	svc.On("Delete", mock.Anything, "in-use").Return(errors.New("volume in use"))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/volumes/in-use", nil))

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}
