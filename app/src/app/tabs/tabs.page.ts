import { Component, OnInit, inject } from '@angular/core';
import { BookService, NotificationService } from '../services';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Script, TextRecognition } from '@capacitor-mlkit/text-recognition';
import { Capacitor } from '@capacitor/core';
import {
  AlertController,
  IonActionSheet,
  IonButton,
  IonButtons,
  IonIcon,
  IonInput,
  IonLabel,
  IonModal,
  IonSpinner,
  IonTabBar,
  IonTabButton,
  IonTabs,
  IonTextarea,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';

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
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonLabel,
    IonInput,
    IonTextarea,
    IonModal,
    IonActionSheet,
    IonSpinner,
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
      text: 'scan book (OCR)',
      data: {
        action: 'ocr',
      },
      handler: async () => {
        await this.addByOcr();
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

  isLookingUpIsbn = false;
  currentLookupSource = 'Google Books';
  isbnSources = [ 'Google Books', 'Open Library', 'Internet Archive', 'Wikidata' ];
  private lookupTimer: any;

  isManualBookModalVisible = false;
  manualPayload: ManualBookPayload = {};

  isManualIsbnModalVisible = false;
  isbnPayload: ManualIsbnPayload = {};

  isBarcodeScanningSupported = false;

  constructor() {
    addIcons({ close });
  }

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
    const isbn = this.isbnPayload.isbn?.trim();

    if (!isbn) {
      await this.notificationService.error('Please enter an ISBN');
      return;
    }

    this.dismissManualIsbnModal();
    await this.lookupAndAddBook(isbn);
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
        await this.lookupAndAddBook(barcode.displayValue);
      }
    } catch (e) {
      if (e !== undefined) {
        await this.notificationService.error(e as string);
      }
    }
  }

  async addByOcr() {
    if (!Capacitor.isNativePlatform()) {
      await this.notificationService.warn('OCR is only available on the mobile app');
      return;
    }

    try {
      const image = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90
      });

      if (!image.path) {
        await this.notificationService.warn('No image was captured');
        return;
      }

      const { text } = await TextRecognition.processImage({
        path: image.path,
        script: Script.Latin
      });

      if (!text?.trim()) {
        await this.notificationService.warn('No text was recognized, please try again');
        return;
      }

      this.prefillManualPayloadFromOcr(text);
      this.isManualBookModalVisible = true;
    } catch (e) {
      await this.notificationService.error(e as string);
    }
  }

  private prefillManualPayloadFromOcr(text: string) {
    const lines = text
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter((x) => x);

    const isbn = this.extractIsbn(lines);

    this.manualPayload = {
      title: this.extractTitle(lines, isbn),
      authors: this.extractAuthors(lines),
      isbn,
      publishYear: this.extractYear(lines)
    };
  }

  private extractIsbn(lines: string[]): string | undefined {
    for (const line of lines) {
      const normalized = line.replace(/[-\s]/g, '').toUpperCase();
      const match = normalized.match(/(97[89]\d{10})/);

      if (match) {
        return match[1];
      }
    }

    for (const line of lines) {
      const normalized = line.replace(/[-\s]/g, '').toUpperCase();
      const match = normalized.match(/(\d{9}[\dX])/);

      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  private extractTitle(lines: string[], isbn?: string): string | undefined {
    const candidates = lines.filter((line) => {
      const normalized = line.replace(/[-\s]/g, '').toUpperCase();

      if (isbn && normalized === isbn) {
        return false;
      }

      if (/^\d+$/.test(normalized)) {
        return false;
      }

      if (/^by\s+/i.test(line)) {
        return false;
      }

      return true;
    });

    return candidates.sort((a, b) => b.length - a.length)[0];
  }

  private extractAuthors(lines: string[]): string | undefined {
    const byLine = lines.find((line) => /^by\s+/i.test(line.trim()));

    return byLine ? byLine.replace(/^by\s+/i, '').trim() : undefined;
  }

  private extractYear(lines: string[]): number | undefined {
    for (const line of lines) {
      const match = line.match(/\b(19|20)\d{2}\b/);

      if (match) {
        return Number(match[0]);
      }
    }

    return undefined;
  }

  private async lookupAndAddBook(isbn: string) {
    this.startLookupIndicator();

    try {
      const result = await this.bookService.createByIsbn({ isbn });
      const source = result?.source ?? 'a service';
      await this.notificationService.success(`Book successfully added (found via ${source})`);
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.stopLookupIndicator();
    }
  }

  private startLookupIndicator() {
    this.isLookingUpIsbn = true;
    this.currentLookupSource = this.isbnSources[0];
    let index = 0;

    this.lookupTimer = setInterval(() => {
      index = (index + 1) % this.isbnSources.length;
      this.currentLookupSource = this.isbnSources[index];
    }, 800);
  }

  private stopLookupIndicator() {
    if (this.lookupTimer) {
      clearInterval(this.lookupTimer);
      this.lookupTimer = undefined;
    }

    this.isLookingUpIsbn = false;
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
