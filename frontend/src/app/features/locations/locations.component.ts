import {Component, inject, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {EmployeeInfoComponent} from "../employees/components/employee-info/employee-info.component";
import {IconComponent} from "../../shared/components/icon";
import {MatButton, MatIconButton} from "@angular/material/button";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef, MatNoDataRow,
  MatRow, MatRowDef, MatTable, MatTableDataSource
} from "@angular/material/table";
import {MatFormField, MatInput, MatLabel} from "@angular/material/input";
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from "@angular/material/sidenav";
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {MatIcon} from '@angular/material/icon';
import {LocationService} from '../../core/services/locations/location.service';
import { Location } from '../../core/services/locations/location.types';
import {MatBottomSheet} from '@angular/material/bottom-sheet';
import {LocationFormComponent} from './components/location-form/location-form.component';

@Component({
  selector: 'app-locations',
  imports: [
    IconComponent,
    MatButton,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatFormField,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIconButton,
    MatInput,
    MatLabel,
    MatPaginator,
    MatRow,
    MatRowDef,
    MatSidenavContainer,
    MatSidenavContent,
    MatSort,
    MatTable,
    MatHeaderCellDef,
    MatNoDataRow
  ],
  templateUrl: './locations.component.html',
  styleUrl: './locations.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LocationsComponent implements OnInit {

  private readonly locationService =  inject(LocationService);
  private readonly bottomSheet = inject(MatBottomSheet);

  displayedColumns: string[] = ['identification_number', 'name', 'address', 'actions'];
  dataSource: MatTableDataSource<Location>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

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


  protected readonly location = location;
}
