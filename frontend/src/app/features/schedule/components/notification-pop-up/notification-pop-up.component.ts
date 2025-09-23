import {ChangeDetectionStrategy, Component, computed, inject, OnInit, ViewEncapsulation} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {NgClass} from '@angular/common';
import {ButtonComponent} from '../../../../shared/components/button/button.component';

interface NotificationData {
  type: 'exceed12h' | 'conflict11h' | 'badWeek35h';
  message: string;
}

@Component({
  selector: 'app-notification-pop-up',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, NgClass, ButtonComponent],
  templateUrl: './notification-pop-up.component.html',
  styleUrl: './notification-pop-up.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class NotificationPopUpComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<NotificationPopUpComponent>); // bez generic type
  readonly data = inject<NotificationData>(MAT_DIALOG_DATA);

  ngOnInit(): void {
    setTimeout(() => {
      this.close();
    }, 5000);
  }

  getNotificationColor(): string {
    switch(this.data.type) {
      case 'exceed12h': return 'yellow';
      case 'conflict11h': return 'red';
      case 'badWeek35h': return 'purple';
      default: return 'gray';
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
