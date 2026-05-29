import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from '../dtos/auth.dto';
import { v4 as uuid } from 'uuid';
import { CodeService } from '../../shared/services/code.service';
import { UserDocument } from '../../users/schemas/user.schema';
import { EmailService } from '../../shared/services/email.service';
import { TemplateService } from '../../shared/services/template.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private codeService: CodeService,
    private emailService: EmailService,
    private templateService: TemplateService
  ) {}

  async login(emailAddress: string, password: string): Promise<AuthDto> {
    const user = await this.userService.findByEmail(emailAddress);

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new UnauthorizedException(null, 'Invalid credentials');
    }

    return {
      authToken: this.generateAuthToken(user),
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress,
      isEmailVerified: user.isEmailVerified
    };
  }

  async register(
    fullName: string,
    emailAddress: string,
    password: string
  ): Promise<AuthDto> {
    let user = await this.userService.findByEmail(emailAddress);

    if (user) {
      throw new ConflictException(null, 'User account already exists.');
    }

    user = await this.userService.create(emailAddress, password);

    // generate and persist the verification code
    const verificationCode = this.codeService.generateVerificationCode();
    user.verificationCode = verificationCode;

    if (fullName) {
      const nameParts = fullName.split(' ');
      user.firstName = nameParts[0] || '';
      user.lastName = nameParts[1] || '';
    }

    await (<UserDocument>user).save();

    // send an email to the user
    const content = this.templateService.getWelcomeVerificationContent(
      user.firstName,
      verificationCode
    );
    await this.emailService.send(
      user.emailAddress,
      'Welcome to Atheneum! Verify your email.',
      content
    );

    return {
      authToken: this.generateAuthToken(user),
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.emailAddress,
      isEmailVerified: user.isEmailVerified
    };
  }

  async forgotPassword(emailAddress: string): Promise<void> {
    const user = await this.userService.findByEmail(emailAddress);

    if (user) {
      const resetCode = this.codeService.generateResetCode();
      user.resetCode = resetCode;
      await (<UserDocument>user).save();

      // send an email to the user
      const content = this.templateService.getForgotPasswordContent(
        user.firstName,
        resetCode
      );
      await this.emailService.send(
        user.emailAddress,
        'Your reset code',
        content
      );
    }
  }

  async resetPassword(
    emailAddress: string,
    resetCode: string,
    password: string
  ): Promise<void> {
    const user = await this.userService.findByEmail(emailAddress);

    if (!user) {
      throw new NotFoundException(null, 'User account not found.');
    }

    if (user.resetCode !== resetCode) {
      throw new BadRequestException(null, 'Reset code does not match.');
    }

    user.passwordHash = password;
    user.resetCode = null;
    await (<UserDocument>user).save();

    // send an email to the user
    const content = this.templateService.getResetPasswordContent(
      user.firstName
    );
    await this.emailService.send(
      user.emailAddress,
      'Password reset successful',
      content
    );
  }

  async verifyEmail(userId: any, verificationCode: string): Promise<void> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException(null, 'User account not found.');
    }

    if (user.verificationCode !== verificationCode) {
      throw new BadRequestException(null, 'Invalid reset code');
    }

    user.isEmailVerified = true;
    user.verificationCode = null;
    await (<UserDocument>user).save();
  }

  async resendVerificationCode(userId: any): Promise<void> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new NotFoundException(null, 'User account not found.');
    }

    if (!user.verificationCode) {
      user.verificationCode = this.codeService.generateVerificationCode();
      await (<UserDocument>user).save();
    }

    // send an email to the user
    const content = this.templateService.getWelcomeVerificationContent(
      user.firstName,
      user.verificationCode
    );
    await this.emailService.send(
      user.emailAddress,
      'Welcome to Atheneum! Verify your email.',
      content
    );
  }

  private generateAuthToken(user: any): string {
    return this.jwtService.sign({
      email: user.emailAddress,
      id: user._id,
      sub: uuid()
    });
  }
}
