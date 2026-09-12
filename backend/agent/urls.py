from django.urls import path

from . import views

urlpatterns = [
    path('health/', views.HealthView.as_view(), name='health'),
    path('catalog/', views.CatalogView.as_view(), name='catalog'),
    path('policy/', views.PolicyView.as_view(), name='policy'),
    path('goal/preview/', views.GoalPreviewView.as_view(), name='goal-preview'),
    path('runs/', views.RunListView.as_view(), name='run-list'),
    path('runs/<int:pk>/', views.RunDetailView.as_view(), name='run-detail'),
    path('runs/<int:pk>/advance/', views.RunAdvanceView.as_view(), name='run-advance'),
    path('runs/<int:pk>/approve/', views.RunApproveView.as_view(), name='run-approve'),
    path('runs/<int:pk>/decline/', views.RunDeclineView.as_view(), name='run-decline'),
    path('runs/<int:pk>/fast-forward/', views.RunFastForwardView.as_view(), name='run-fast-forward'),
    path('activity/', views.ActivityView.as_view(), name='activity'),
]
