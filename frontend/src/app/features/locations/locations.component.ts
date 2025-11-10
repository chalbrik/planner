import {ChangeDetectionStrategy, Component, inject, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {IconComponent} from "../../shared/components/icon";
import {MatButton, MatIconButton} from "@angular/material/button";
import {
  MatCell, MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatNoDataRow,
  MatRow, MatRowDef, MatTable, MatTableDataSource
} from "@angular/material/table";
import {MatFormField, MatInput} from "@angular/material/input";
import { MatSidenavContainer, MatSidenavContent} from "@angular/material/sidenav";
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {LocationService} from '../../core/services/locations/location.service';
import { Location } from '../../core/services/locations/location.types';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {LocationFormComponent} from './components/location-form/location-form.component';
import {Employee} from '../../core/services/employees/employee.types';
import {DialogComponent} from '../../shared/components/dialog/dialog.component';
import {MatDialog} from '@angular/material/dialog';

@Component({
  selector: 'app-locations',
  imports: [
    IconComponent,
    MatButton,
    MatCell,
    MatColumnDef,
    MatFormField,
    MatHeaderCell,
    MatHeaderRow,
    MatIconButton,
    MatInput,
    MatPaginator,
    MatRow,
    MatSidenavContainer,
    MatSidenavContent,
    MatSort,
    MatTable,
    MatNoDataRow,
    MatHeaderCellDef,
    MatCellDef,
    MatHeaderRowDef,
    MatRowDef
  ],
  templateUrl: './locations.component.html',
  styleUrl: './locations.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocationsComponent implements OnInit {

  private readonly locationService =  inject(LocationService);
  private readonly bottomSheet = inject(MatBottomSheet);

  displayedColumns: string[] = ['identification_number', 'name', 'address', 'actions'];
  dataSource: MatTableDataSource<Location>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dialog: MatDialog = inject(MatDialog);

  constructor() {
    this.dataSource = new MatTableDataSource<Location>([]);
  }

  ngOnInit() {
    this.loadLocations();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadLocations(): void {
    this.locationService.getLocations().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        // console.log("Lokacje: ", data);
      },
      error: (error) => {
        // console.error("Błąd ładowania lokacji: ", error);
      }
    })
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  onAddLocation(): void {
    const bottomSheetRef = this.bottomSheet.open(LocationFormComponent, {
      ariaLabel: 'Dodaj nowy obiekt',
    });

    bottomSheetRef.afterDismissed().subscribe(result => {
      if (result) {
        this.loadLocations();
      }
    });
  }

  onDeleteLocation(location: Location, event: Event): void {
    // Zatrzymaj propagację - żeby nie otworzyć sidenav
    event.stopPropagation();
    const dialogRef = this.dialog.open(DialogComponent, {
      data: {
        title: 'Potwierdzenie usunięcia',
        message: `Czy na pewno chcesz usunąć obiekt ${location.name}?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.locationService.deleteLocation(location.id).subscribe({
        next: () => {
          // Usuń z dataSource
          const currentData = this.dataSource.data;
          this.dataSource.data = currentData.filter(loc => loc.id !== location.id);

          // // Zamknij sidenav jeśli usuwany pracownik był wybrany
          // if (this.selecteLocation()?.id === employee.id) {
          //   this.closeSidenav();
          // }
        },
        error: (error) => {
          console.error("Błąd podczas usuwania obiektu: ", error);
        }
      });
    });
  }


  protected readonly location = location;
}
