"""
Reużywalne mixiny

"""
from django.db.models import QuerySet


class QueryOptimizationMixin:
    """
    Mixin do automatycznej optymalizacji queries.

    Użycie w ViewSet:
        class EmployeeViewSet(QueryOptimizationMixin, ModelViewSet):
            select_related_fields = ['user', 'school']
            prefetch_related_fields = ['locations', 'previous_employers']
    """
    select_related_fields = []  # Lista pól dla select_related
    prefetch_related_fields = []  # Lista pól dla prefetch_related

    def get_queryset(self):
        """
        Optymalizuje queryset dodając select_related i prefetch_related.
        """
        queryset = super().get_queryset()

        if self.select_related_fields:
            queryset = queryset.select_related(*self.select_related_fields)

        if self.prefetch_related_fields:
            queryset = queryset.prefetch_related(*self.prefetch_related_fields)

        return queryset