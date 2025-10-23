import { Component, OnInit, inject } from '@angular/core';
import { BookService, NotificationService } from '../services';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import {AlertController, IonicModule} from '@ionic/angular';
import {FormsModule} from "@angular/forms";

export interface ManualBookPayload {
  title?: string;
  authors?: string;
  summary?: string;
  isbn?: string;
  publishYear?: number;
  publisher?: string;
  pageCount?: number;
}

export interface ManualIsbnPayload {
  isbn?: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  templateUrl: 'tabs.page.html',
  styleUrls: [ 'tabs.page.scss' ],
  imports: [
    IonicModule,
    FormsModule
  ]
})
export class TabsPage implements OnInit {
  private bookService = inject(BookService);
  private notificationService = inject(NotificationService);
  private alertController = inject(AlertController);

  public actionSheetButtons = [
    {
      text: 'scan barcode',
      data: {
        action: 'scan-isbn',
      },
      handler: async () => {
        await this.addByScannedIsbn();
      }
    },
    {
      text: 'enter isbn',
      data: {
        action: 'manual-isbn',
      },
      handler: () => {
        this.isManualIsbnModalVisible = true;
      }
    },
    {
      text: 'manually enter',
      data: {
        action: 'manual-entry',
      },
      handler: () => {
        this.isManualBookModalVisible = true;
      }
    },
    {
      text: 'close',
      role: 'cancel',
      data: {
        action: 'cancel',
      },
    },
  ];

  isAddingBook: boolean = false;

  isManualBookModalVisible = false;
  manualPayload: ManualBookPayload = {};

  isManualIsbnModalVisible = false;
  isbnPayload: ManualIsbnPayload = {};

  isBarcodeScanningSupported = false;

  async ngOnInit() {
    const result = await BarcodeScanner.isSupported();
    this.isBarcodeScanningSupported = result.supported;
  }

  dismissManualBookModal() {
    this.isManualBookModalVisible = false;
    this.manualPayload = {};
  }

  async addManual() {
    this.isAddingBook = true;

    try {
      await this.bookService.createManually(this.manualPayload);
      await this.notificationService.success('Book successfully added to library');

      this.dismissManualBookModal();
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isAddingBook = false;
    }
  }

  dismissManualIsbnModal() {
    this.isManualIsbnModalVisible = false;
    this.isbnPayload = {};
  }

  async addByIsbn() {
    this.isAddingBook = true;

    try {
      await this.bookService.createByIsbn(this.isbnPayload);
      await this.notificationService.success('Book successfully added to library');

      this.dismissManualIsbnModal();
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isAddingBook = false;
    }
  }

  async canDismiss(data?: any, role?: string) {
    return role === undefined;
  }

  async addByScannedIsbn() {
    if (!this.isBarcodeScanningSupported) {
      await this.showMissingCamera();
      return;
    }

    const hasPermissions = await this.requestPermissions();

    if (!hasPermissions) {
      await this.showMissingPermissions();
      return;
    }

    try {
      const { barcodes } = await BarcodeScanner.scan();

      if (!barcodes.length) {
        await this.notificationService.warn('No ISBN codes were found');
        return;
      }

      for (const barcode of barcodes) {
        await this.bookService.createByIsbn({ isbn: barcode.displayValue });
        await this.notificationService.success('Book successfully added to library');
      }
    } catch (e) {
      if (e !== undefined) {
        await this.notificationService.error(e as string);
      }
    } finally {
      this.isAddingBook = false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  }

  async showMissingPermissions(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission denied',
      message: 'Please grant camera permission to use the barcode scanner',
      buttons: [ 'OK' ],
    });
    await alert.present();
  }

  async showMissingCamera(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Unsupported hardware',
      message: 'Camera functionality does not appear to be supported',
      buttons: [ 'OK' ],
    });
    await alert.present();
  }
}
