import {Component, computed, inject, OnInit, signal, ViewChild} from '@angular/core';
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
import {MatFormField, MatInput} from "@angular/material/input";
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from "@angular/material/sidenav";
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {DisposalService} from '../../core/services/disposal/disposal.service';
import {Disposal} from '../../core/services/disposal/disposal.types';
import {InfoDisplayComponent} from '../../shared/components/info-display/info-display.component';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader, MatExpansionPanelTitle
} from '@angular/material/expansion';
import {MatDivider} from '@angular/material/divider';

@Component({
  selector: 'app-disposal',
  imports: [
    IconComponent,
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatFormField,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIconButton,
    MatInput,
    MatRow,
    MatRowDef,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    MatSort,
    MatTable,
    MatHeaderCellDef,
    MatNoDataRow,
    InfoDisplayComponent,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelDescription,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatDivider,
    MatPaginator
  ],
  templateUrl: './disposal.component.html',
  styleUrl: './disposal.component.scss'
})
export class DisposalComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  dataSource: MatTableDataSource<any>;
  displayedColumns: string[] = ['name', 'actions'];

  private disposalService = inject(DisposalService);
  selectedDisposal = signal<Disposal | null>(null);
  isSidenavOpen = computed(() => !!this.selectedDisposal());


  constructor() {
    this.dataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    this.loadDisposal();
  }

  loadDisposal(){
    this.disposalService.getDisposals().subscribe({
      next: (data: Disposal[]) => {
        console.log(data);
        this.dataSource.data = data;
      },
      error: (error: any) => {
        console.error("Błąd ładowania dyspozycji: ", error);
    }
    });
  }


  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    // this.dataSource.filter = filterValue.trim().toLowerCase();

    // if (this.dataSource.paginator) {
    //   this.dataSource.paginator.firstPage();
    // }
  }

  onDeleteDisposal(disposal: Disposal, event: Event): void {
    // Zatrzymaj propagację - żeby nie otworzyć sidenav
    event.stopPropagation();

    this.disposalService.deleteDisposal(disposal.id).subscribe({
      next: () => {
        // Usuń z dataSource
        const currentData = this.dataSource.data;
        this.dataSource.data = currentData.filter(emp => emp.id !== disposal.id);

        // Zamknij sidenav jeśli usuwany pracownik był wybrany
        // if (this.selectedEmployee()?.id === employee.id) {
        //   this.closeSidenav();
        // }
      },
      error: (error: any) => {
        console.error("Błąd podczas usuwania dyspozycji: ", error);
      }
    });
  }

  onRowClick(disposal: Disposal): void {
    this.selectedDisposal.set(disposal);
  }

  closeSidenav(): void {
    this.selectedDisposal.set(null);
  }

}
