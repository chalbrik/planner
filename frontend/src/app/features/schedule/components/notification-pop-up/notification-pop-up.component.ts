import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface NotificationData {
  type: 'exceed12h' | 'conflict11h' | 'badWeek35h';
  message: string;
}

@Component({
  selector: 'app-notification-pop-up',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './notification-pop-up.component.html',
  styleUrl: './notification-pop-up.component.scss'
})
export class NotificationPopUpComponent {
  private readonly dialogRef = inject(MatDialogRef<NotificationPopUpComponent>); // bez generic type
  readonly data = inject<NotificationData>(MAT_DIALOG_DATA);

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
