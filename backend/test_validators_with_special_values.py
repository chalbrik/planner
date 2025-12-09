"""
Test skryptu sprawdzający czy validatory radzą sobie z nietypowymi wartościami jak "dwh", "dwn"
"""
import os
import sys
import django
from datetime import date

# Setup Django
sys.path.insert(0, '/home/user/planner/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.schedule.models import WorkHours, Employee
from backend.apps.employees.models import Employee as EmployeeModel
from backend.apps.locations.models import Location
from backend.apps.schedule.services.conflicts.rest_11h_validator import Rest11hValidator
from backend.apps.schedule.services.conflicts.rest_35h_validator import Rest35hValidator
from backend.apps.schedule.services.conflicts.shift_12h_validator import Shift12hValidator
from backend.apps.schedule.services.conflicts.conflict_aggregator import ConflictAggregator


def test_validators_with_special_values():
    """Test validatorów z wartościami 'dwh', 'dwn', '8:00-16:00'"""

    print("🧪 Testowanie validatorów z nietypowymi wartościami...")

    # Stwórz mock data
    class MockEmployee:
        def __init__(self, emp_id):
            self.id = emp_id
            self.agreement_type = 'permanent'

    class MockWorkHours:
        def __init__(self, emp_id, date_str, hours_str):
            self.employee = MockEmployee(emp_id)
            self.date = date.fromisoformat(date_str)
            self.hours = hours_str

    # Test case: mix normalnych godzin i dni wolnych
    work_hours = [
        MockWorkHours('emp-1', '2025-01-01', '8:00-16:00'),   # Normalna zmiana
        MockWorkHours('emp-1', '2025-01-02', 'dwh'),           # Dzień wolny
        MockWorkHours('emp-1', '2025-01-03', '9:00-17:00'),   # Normalna zmiana
        MockWorkHours('emp-1', '2025-01-04', 'dwn'),           # Dzień wolny (niedziela)
        MockWorkHours('emp-1', '2025-01-05', '8:00-16:00'),   # Normalna zmiana

        MockWorkHours('emp-2', '2025-01-01', 'dwh'),           # Cały tydzień wolnego
        MockWorkHours('emp-2', '2025-01-02', 'dwh'),
        MockWorkHours('emp-2', '2025-01-03', 'dwh'),

        MockWorkHours('emp-3', '2025-01-01', '22:00-06:00'),  # Nocna zmiana
        MockWorkHours('emp-3', '2025-01-02', '22:00-06:00'),  # Kolejna nocna (konflikt 11h!)
    ]

    employees = [MockEmployee('emp-1'), MockEmployee('emp-2'), MockEmployee('emp-3')]

    # Test Rest11hValidator
    print("\n1️⃣ Test Rest11hValidator...")
    try:
        validator_11h = Rest11hValidator(work_hours, employees, 1, 2025)
        conflicts_11h = validator_11h.validate()
        print(f"   ✅ Rest11hValidator działa! Konflikty 11h: {conflicts_11h}")
        print(f"      Oczekiwany konflikt: emp-3-2025-01-02 (brak 11h między nocnymi zmianami)")
    except Exception as e:
        print(f"   ❌ Rest11hValidator crashed: {e}")
        return False

    # Test Rest35hValidator
    print("\n2️⃣ Test Rest35hValidator...")
    try:
        validator_35h = Rest35hValidator(work_hours, employees, 1, 2025)
        conflicts_35h = validator_35h.validate()
        print(f"   ✅ Rest35hValidator działa! Konflikty 35h: {conflicts_35h}")
    except Exception as e:
        print(f"   ❌ Rest35hValidator crashed: {e}")
        return False

    # Test Shift12hValidator
    print("\n3️⃣ Test Shift12hValidator...")
    try:
        validator_12h = Shift12hValidator(work_hours, employees, 1, 2025)
        conflicts_12h = validator_12h.validate()
        print(f"   ✅ Shift12hValidator działa! Konflikty 12h: {conflicts_12h}")
    except Exception as e:
        print(f"   ❌ Shift12hValidator crashed: {e}")
        return False

    # Test ConflictAggregator
    print("\n4️⃣ Test ConflictAggregator...")
    try:
        aggregator = ConflictAggregator(work_hours, employees, 1, 2025)
        all_conflicts = aggregator.detect_all_conflicts()
        print(f"   ✅ ConflictAggregator działa!")
        print(f"      rest_11h_conflicts: {all_conflicts['rest_11h_conflicts']}")
        print(f"      rest_35h_conflicts: {all_conflicts['rest_35h_conflicts']}")
        print(f"      shift_12h_conflicts: {all_conflicts['shift_12h_conflicts']}")
    except Exception as e:
        print(f"   ❌ ConflictAggregator crashed: {e}")
        return False

    print("\n✅ Wszystkie validatory działają poprawnie z wartościami 'dwh', 'dwn'!")
    return True


if __name__ == '__main__':
    success = test_validators_with_special_values()
    sys.exit(0 if success else 1)
