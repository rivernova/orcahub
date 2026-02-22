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
	networkapi "github.com/rivernova/orcahub/internal/docker/networks/api"
	"github.com/rivernova/orcahub/internal/docker/networks/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func init() { gin.SetMode(gin.TestMode) }

type mockNetworkService struct{ mock.Mock }

func (m *mockNetworkService) List(ctx context.Context) ([]model.Network, error) {
	args := m.Called(ctx)
	return args.Get(0).([]model.Network), args.Error(1)
}
func (m *mockNetworkService) Inspect(ctx context.Context, id string) (*model.Network, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Network), args.Error(1)
}
func (m *mockNetworkService) Create(ctx context.Context, opts model.CreateNetworkOptions) (*model.Network, error) {
	args := m.Called(ctx, opts)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*model.Network), args.Error(1)
}
func (m *mockNetworkService) Delete(ctx context.Context, id string) error {
	return m.Called(ctx, id).Error(0)
}
func (m *mockNetworkService) Connect(ctx context.Context, networkID string, opts model.ConnectOptions) error {
	return m.Called(ctx, networkID, opts).Error(0)
}
func (m *mockNetworkService) Disconnect(ctx context.Context, networkID string, opts model.DisconnectOptions) error {
	return m.Called(ctx, networkID, opts).Error(0)
}

func setupNetworkRouter(svc *mockNetworkService) *gin.Engine {
	r := gin.New()
	h := networkapi.NewHandler(svc)
	r.GET("/networks", h.List)
	r.GET("/networks/:id", h.Inspect)
	r.POST("/networks", h.Create)
	r.DELETE("/networks/:id", h.Delete)
	r.POST("/networks/:id/connect", h.Connect)
	r.POST("/networks/:id/disconnect", h.Disconnect)
	return r
}

func TestNetworkHandler_List_OK(t *testing.T) {
	svc := &mockNetworkService{}
	r := setupNetworkRouter(svc)

	svc.On("List", mock.Anything).Return([]model.Network{
		{ID: "net1", Name: "bridge", Driver: "bridge"},
	}, nil)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/networks", nil))

	assert.Equal(t, http.StatusOK, w.Code)
	var resp []map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Len(t, resp, 1)
	assert.Equal(t, "bridge", resp[0]["name"])
}

func TestNetworkHandler_List_Error(t *testing.T) {
	svc := &mockNetworkService{}
	r := setupNetworkRouter(svc)

	svc.On("List", mock.Anything).Return([]model.Network{}, errors.New("daemon error"))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/networks", nil))

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestNetworkHandler_Inspect_OK(t *testing.T) {
	svc := &mockNetworkService{}
	r := setupNetworkRouter(svc)

	svc.On("Inspect", mock.Anything, "net1").Return(
		&model.Network{ID: "net1", Name: "my-network", Driver: "bridge"}, nil,
	)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/networks/net1", nil))

	assert.Equal(t, http.StatusOK, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "net1", resp["id"])
}

func TestNetworkHandler_Inspect_NotFound(t *testing.T) {
	svc := &mockNetworkService{}
	r := setupNetworkRouter(svc)

	svc.On("Inspect", mock.Anything, "nope").Return(nil, errors.New("network not found"))

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/networks/nope", nil))

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestNetworkHandler_Create_OK(t *testing.T) {
	svc := &mockNetworkService{}
	r := setupNetworkRouter(svc)

	svc.On("Create", mock.Anything, mock.AnythingOfType("model.CreateNetworkOptions")).
		Return(&model.Network{ID: "newnet", Name: "my-network", Driver: "bridge"}, nil)

	body, _ := json.Marshal(map[string]string{"name": "my-network", "driver": "bridge"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/networks", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	assert.Equal(t, "newnet", resp["id"])
}

func TestNetworkHandler_Delete_OK(t *testing.T) {
	svc := &mockNetworkService{}
	r := setupNetworkRouter(svc)

	svc.On("Delete", mock.Anything, "net1").Return(nil)

	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest(http.MethodDelete, "/networks/net1", nil))

	assert.Equal(t, http.StatusNoContent, w.Code)
}

func TestNetworkHandler_Connect_OK(t *testing.T) {
	svc := &mockNetworkService{}
	r := setupNetworkRouter(svc)

	svc.On("Connect", mock.Anything, "net1", mock.AnythingOfType("model.ConnectOptions")).Return(nil)

	body, _ := json.Marshal(map[string]string{"container_id": "abc123"})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/networks/net1/connect", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}

func TestNetworkHandler_Disconnect_OK(t *testing.T) {
	svc := &mockNetworkService{}
	r := setupNetworkRouter(svc)

	svc.On("Disconnect", mock.Anything, "net1", mock.AnythingOfType("model.DisconnectOptions")).Return(nil)

	body, _ := json.Marshal(map[string]interface{}{"container_id": "abc123", "force": false})
	w := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/networks/net1/disconnect", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
