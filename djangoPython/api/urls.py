from django.urls import path
from . import views

urlpatterns = [
    path('courses/', views.product_list, name='product_list'),
    path('course_report_draft/', views.product_stock_dashboard, name='all_product_list'),
    path('course_report/', views.product_stock_dashboard_react, name='all_product_list_react'),
    path('sales_report_draft/', views.sales_report_view, name='working_with_database'),
    path('sales_report/', views.sales_report_view_react, name='sales_report_react'),
    path('generate_invoice_draft/', views.generate_invoice_view, name='generate_invoice'),
    path('invoice_report/', views.generate_invoice_view_react, name='generate_invoice_react'),
    path('update_stock/', views.update_stock, name='update_stock')
]