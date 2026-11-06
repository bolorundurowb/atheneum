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
  coverArt?: string;
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
      text: 'scan barcode and look up ISBN',
      data: {
        action: 'scan-isbn',
      },
      handler: async () => {
        await this.addByScannedIsbn();
      }
    },
    {
      text: 'look up by ISBN',
      data: {
        action: 'manual-isbn',
      },
      handler: () => {
        this.isManualIsbnModalVisible = true;
      }
    },
    {
      text: 'enter book details manually',
      data: {
        action: 'manual-entry',
      },
      handler: () => {
        this.isManualBookModalVisible = true;
      }
    },
    {
      text: 'scan both covers (auto-add if recognized)',
      data: {
        action: 'ocr',
      },
      handler: async () => {
        await this.addByOcr();
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
  isUploadingCover = false;

  isLookingUpIsbn = false;
  currentLookupSource = 'Google Books';
  isbnSources = [ 'Google Books', 'Open Library', 'Internet Archive' ];
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

  async chooseBookCover() {
    this.isUploadingCover = true;
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
        quality: 85,
        width: 1200
      });
      if (!photo.base64String) {
        return;
      }

      const mimeType = photo.format === 'png' ? 'image/png' : 'image/jpeg';
      const { url } = await this.bookService.uploadCover(
        `data:${mimeType};base64,${photo.base64String}`
      );
      this.manualPayload.coverArt = url;
      await this.notificationService.success('Cover image uploaded');
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isUploadingCover = false;
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
      await this.notificationService.info('Capture the front cover');
      const front = await this.captureBookSide();
      if (!front) {
        await this.notificationService.warn('Front cover photo was not captured');
        return;
      }

      await this.notificationService.info('Now capture the back cover');
      const back = await this.captureBookSide();
      if (!back) {
        await this.notificationService.warn('Back cover photo was not captured');
        return;
      }

      await this.notificationService.info('Photos saved; book details are processing in the background');
      void this.processBookPhotos(front, back);
    } catch (e) {
      await this.notificationService.error(e as string);
    }
  }

  private async captureBookSide(): Promise<string | undefined> {
    const image = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 95
    });
    return image.path;
  }

  private async processBookPhotos(frontPath: string, backPath: string) {
    try {
      const [front, back] = await Promise.all([
        TextRecognition.processImage({ path: frontPath, script: Script.Latin }),
        TextRecognition.processImage({ path: backPath, script: Script.Latin })
      ]);
      const frontText = front.text?.trim() || '';
      const backText = back.text?.trim() || '';
      const details = this.extractBookDetails(frontText, backText);
      const confidence = this.getOcrConfidence(details);

      if (confidence < 0.75) {
        await this.logOcrFailure('low-confidence', confidence);
        return;
      }

      if (details.isbn) {
        try {
          await this.bookService.createByIsbn({ isbn: details.isbn });
          await this.notificationService.success('Book added from the cover scan');
          return;
        } catch (error) {
          console.info('ISBN lookup was inconclusive; using the scanned cover details.', error);
        }
      }

      await this.bookService.createManually(details);
      await this.notificationService.success('Book added from the cover scan');
    } catch (error) {
      await this.logOcrFailure('processing-error');
      console.warn('Book cover scan could not be processed.', error);
    }
  }

  private async logOcrFailure(reason: string, confidence?: number) {
    try {
      await this.bookService.logOcrFailure({ reason, confidence });
    } catch (error) {
      console.warn('Could not save the book scan failure log.', error);
    }
  }

  private extractBookDetails(frontText: string, backText: string): ManualBookPayload {
    const frontLines = this.getOcrLines(frontText);
    const backLines = this.getOcrLines(backText);
    const allLines = [...frontLines, ...backLines];
    return {
      title: this.extractTitle(frontLines),
      authors: this.extractAuthors(frontLines) || this.extractAuthors(backLines),
      isbn: this.extractIsbn(backLines),
      publishYear: this.extractYear(backLines),
      publisher: this.extractPublisher(backLines),
      summary: backLines.join(' ').slice(0, 2000),
      pageCount: this.extractPageCount(allLines)
    };
  }

  private getOcrLines(text: string): string[] {
    return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }

  private getOcrConfidence(details: ManualBookPayload): number {
    return (
      (details.isbn ? 0.5 : 0) +
      (details.title ? 0.3 : 0) +
      (details.authors ? 0.25 : 0) +
      (details.publisher ? 0.1 : 0) +
      (details.publishYear ? 0.1 : 0)
    );
  }

  private extractPublisher(lines: string[]): string | undefined {
    const publisherLine = lines.find((line) => /\b(published|publisher|press)\b/i.test(line));
    return publisherLine?.replace(/^.*?\b(?:published by|publisher|press)\s*:?[\s]*/i, '').trim() || undefined;
  }

  private extractPageCount(lines: string[]): number | undefined {
    const match = lines.join(' ').match(/\b(\d{2,4})\s*(?:pages|p\.)\b/i);
    return match ? Number(match[1]) : undefined;
  }

  private extractIsbn(lines: string[]): string | undefined {
    for (const line of lines) {
      const normalized = line.replace(/[-\s]/g, '').toUpperCase();
      const match = normalized.match(/(97[89]\d{10})/);

      if (match && this.isValidIsbn13(match[1])) {
        return match[1];
      }
    }

    for (const line of lines) {
      const normalized = line.replace(/[-\s]/g, '').toUpperCase();
      const match = normalized.match(/(\d{9}[\dX])/);

      if (match && this.isValidIsbn10(match[1])) {
        return match[1];
      }
    }

    return undefined;
  }

  private isValidIsbn13(isbn: string): boolean {
    const checksum = [...isbn.slice(0, 12)].reduce(
      (sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3),
      0
    );
    return (10 - (checksum % 10)) % 10 === Number(isbn[12]);
  }

  private isValidIsbn10(isbn: string): boolean {
    if (!/^\d{9}[\dX]$/.test(isbn)) return false;
    const checksum = [...isbn].reduce((sum, digit, index) => {
      const value = digit === 'X' ? 10 : Number(digit);
      return sum + value * (10 - index);
    }, 0);
    return checksum % 11 === 0;
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
    if (byLine) return byLine.replace(/^by\s+/i, '').trim();

    const namePattern = /^[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){1,4}$/;
    const candidates = lines.filter((line) =>
      namePattern.test(line) && !/^(?:THE|A|AN|AND|OF|FOR)\b/.test(line)
    );
    return candidates.slice(-2).join(', ') || undefined;
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

  stopLookupIndicator() {
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
