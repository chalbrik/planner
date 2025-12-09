from decimal import Decimal
from datetime import date
from dateutil.relativedelta import relativedelta
from ..models import Employee, VacationLeave
import logging

logger = logging.getLogger('employees.services')


class VacationService:
   # Słownik mapujący typ szkoły na lata stażu
   EDUCATION_WORK_EXPERIENCE = {
       'basic_vocational': 3,  # zasadnicza zawodowa - 3 lata
       'secondary_vocational': 5,  # średnia zawodowa - 5 lat
       'secondary_vocational_graduates': 5,  # średnia zawodowa absolwenci - 5 lat
       'secondary_general': 4,  # średnia ogólnokształcąca - 4 lata
       'post_secondary': 6,  # policealna - 6 lat
       'higher_education': 8,  # wyższa - 8 lat
   }

   @staticmethod
   def calculate_work_experience(school_type: str, previous_employers: list) -> int:
       """
       Oblicza całkowity staż pracy na podstawie:
       1. Typu ukończonej szkoły
       2. Czasu pracy u poprzednich pracodawców
       """

       # Staż z wykształcenia
       education_experience = VacationService.EDUCATION_WORK_EXPERIENCE.get(school_type, 0)

       # Staż z poprzednich miejsc pracy
       employment_experience = 0

       for i, employer in enumerate(previous_employers):
           start_date = employer.get('work_date_start')
           end_date = employer.get('work_date_end')

           if start_date and end_date:
               # Konwertuj stringi na daty
               if isinstance(start_date, str):
                   start_date = date.fromisoformat(start_date.split('T')[0])  # Usuń część czasu
               if isinstance(end_date, str):
                   end_date = date.fromisoformat(end_date.split('T')[0])  # Usuń część czasu

               years_worked = relativedelta(end_date, start_date).years
               months_worked = relativedelta(end_date, start_date).months
               employer_experience = years_worked + (months_worked / 12)

               # Dodaj lata + miesiące jako ułamek roku
               employment_experience += employer_experience

       total_experience = education_experience + int(employment_experience)

       return total_experience

   @staticmethod
   def calculate_vacation_days(birth_date: date, agreement_type: str, school_type: str,
                               previous_employers: list) -> dict:
       """Oblicza urlop na podstawie stażu pracy"""

       if agreement_type != 'permanent':
           # Umowa zlecenie - brak urlopu
           return {
               'current_vacation_days': Decimal('0'),
               'current_vacation_hours': Decimal('0'),
               'remaining_vacation_days': Decimal('0'),
               'remaining_vacation_hours': Decimal('0'),
               'used_vacation_days': Decimal('0'),
               'used_vacation_hours': Decimal('0'),
           }

       # Oblicz staż pracy
       work_experience = VacationService.calculate_work_experience(school_type, previous_employers)

       # Urlop zależny od stażu pracy (zgodnie z Kodeksem Pracy)
       if work_experience >= 10:
           vacation_days = Decimal('26')  # 26 dni dla stażu 10+ lat
       else:
           vacation_days = Decimal('20')  # 20 dni dla stażu poniżej 10 lat

       vacation_hours = vacation_days * Decimal('8')  # 8h = dzień pracy

       return {
           'current_vacation_days': vacation_days,
           'current_vacation_hours': vacation_hours,
           'remaining_vacation_days': Decimal('0'),
           'remaining_vacation_hours': Decimal('0'),
           'used_vacation_days': Decimal('0'),
           'used_vacation_hours': Decimal('0'),
       }

   @staticmethod
   def create_vacation_leave(employee: Employee, vacation_data: dict) -> VacationLeave:
       """Tworzy rekord urlopu dla pracownika"""

       return VacationLeave.objects.create(
           employee=employee,
           **vacation_data
       )