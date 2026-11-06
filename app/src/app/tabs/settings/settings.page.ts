import { Component, OnInit, inject } from '@angular/core';
import { AccountService, AuthService, NotificationService, UpdateService, UserService } from '../../services';
import { Router } from '@angular/router';

import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import {
  AlertController,
  IonAccordion,
  IonAccordionGroup,
  IonAlert,
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonRefresher,
  IonRefresherContent
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { GithubRateLimitError } from '../../services/update.service';

interface UpdateProfilePayload {
  id?: string;
  firstName?: string;
  lastName?: string;
  emailAddress?: string;
}

interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: 'settings.page.html',
  styleUrls: [ 'settings.page.scss' ],
  imports: [
    IonContent,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonAlert,
    IonSpinner,
    FormsModule,
    IonRefresher,
    IonRefresherContent
  ]
})
export class SettingsPage implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private accountService = inject(AccountService);
  private updateService = inject(UpdateService);
  private alertController = inject(AlertController);

  appVersion?: string;
  latestReleaseVersion?: string;
  latestReleaseUrl?: string;
  updateAvailable = false;
  isCheckingForUpdates = false;
  logOutButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
      }
    },
    {
      text: 'OK',
      role: 'confirm',
      handler: async () => {
        this.authService.logout();
        await this.router.navigate([ 'auth', 'login' ]);
      }
    }
  ];
  deleteAccountButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      handler: () => {
      }
    },
    {
      text: 'OK',
      role: 'confirm',
      handler: async () => {
        await this.accountService.delete();
        this.authService.logout();
        await this.router.navigate([ 'auth', 'login' ]);
      }
    }
  ];

  isUpdatingProfile = false;
  updatePayload: UpdateProfilePayload = {};

  isChangingPassword = false;
  changePayload: ChangePasswordPayload = {};

  async loadData() {
    this.appVersion = await this.getAppVersion();

    const currentUser = this.authService.getUser();
    this.setUser(currentUser);

    // load the latest user details
    const profile = await this.userService.getProfile();
    this.setUser(profile);
    this.authService.persistUser({ ...currentUser, ...profile });
  }

  async ngOnInit() {
    await this.loadData();
    void this.checkForUpdates(false);
  }

  async checkForUpdates(showCurrentStatus = true) {
    this.isCheckingForUpdates = true;
    try {
      const release = await this.updateService.getLatestRelease();
      this.latestReleaseVersion = release.tag_name;
      this.latestReleaseUrl = release.html_url;
      this.updateAvailable = !!this.appVersion && this.updateService.isNewerVersion(
        release.tag_name,
        this.appVersion
      );

      if (this.updateAvailable) {
        const alert = await this.alertController.create({
          header: 'Update available',
          message: `Atheneum ${release.tag_name} is available. Open the GitHub release to download it.`,
          buttons: [
            { text: 'Later', role: 'cancel' },
            { text: 'View release', handler: () => this.openLatestRelease() }
          ]
        });
        await alert.present();
      } else if (showCurrentStatus) {
        await this.notificationService.info('You are using the latest release');
      }
    } catch (e) {
      if (showCurrentStatus) {
        if (e instanceof GithubRateLimitError) {
          const minutes = Math.max(1, Math.ceil((e.retryAt - Date.now()) / 60000));
          await this.notificationService.info(
            `GitHub is temporarily limiting update checks. Atheneum is still available; try again in about ${minutes} minutes.`
          );
        } else {
          await this.notificationService.error('Could not check GitHub for updates');
        }
      }
    } finally {
      this.isCheckingForUpdates = false;
    }
  }

  async openLatestRelease() {
    if (this.latestReleaseUrl) {
      await Browser.open({ url: this.latestReleaseUrl });
    }
  }

  async handleRefresh(event: any) {
    try {
      await this.loadData();
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      event.target.complete();
    }
  }

  async getAppVersion(): Promise<string | undefined> {
    try {
      const appInfo = await App.getInfo();
      return appInfo.version;
    } catch (e) {
      console.error('Failed to get the app version', e);
      return undefined;
    }
  }

  async updateProfile() {
    this.isUpdatingProfile = true;

    try {
      await this.userService.updateProfile(this.updatePayload);
      await this.notificationService.success('Profile successfully updated');
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isUpdatingProfile = false;
    }
  }

  async changePassword() {
    if (Number(this.changePayload.newPassword?.length) < 8) {
      await this.notificationService.error('The password must be at least 8 characters');
      return;
    }

    if (this.changePayload.confirmNewPassword !== this.changePayload.newPassword) {
      await this.notificationService.error('The password and confirmation must match');
      return;
    }

    this.isChangingPassword = true;

    try {
      await this.userService.updatePassword(this.changePayload);
      await this.notificationService.success('Password changed successfully');
      this.changePayload = {};
    } catch (e) {
      await this.notificationService.error(e as string);
    } finally {
      this.isChangingPassword = false;
    }
  }

  async buyMeACoffee() {
    await Browser.open({ url: 'https://www.buymeacoffee.com/bolorundurowb' });
  }

  async goToSourceCode() {
    await Browser.open({ url: 'https://github.com/bolorundurowb/atheneum' });
  }

  async giveFeedback() {
    await Browser.open({ url: 'https://github.com/bolorundurowb/atheneum/issues' });
  }

  setUser(user: any) {
    const { _id, firstName, lastName, emailAddress } = user;
    this.updatePayload = { id: _id, firstName, lastName, emailAddress };
  }
}
