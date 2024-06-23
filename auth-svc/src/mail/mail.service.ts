import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { VerificationDataDto } from 'src/dto/verification-data.dto';

/**
 * MailService is a provider class with a method to send a verification email.
 * 
 * @Injectable Decorator makes the class a provider. It allows Nest to inject the class as a dependency.
 */
@Injectable()
export class MailService {
  /**
   * Constructor with MailerService and ConfigService injected.
   * 
   * @param mailerService Injected MailerService instance for sending emails.
   * @param configService Injected ConfigService instance for reading environment variables.
   */
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Sends a verification email to the provided receiver with a verification link.
   * 
   * @param key Unique key for verification link generation.
   * @param receiver Email address of the receiver.
   */
  sendVerificationMail(dto: VerificationDataDto): void {
    const host = this.configService.get<string>('URL_HOST');
    const port = this.configService.get<number>('URL_PORT');

    // Verification URL with the unique key
    const url = `http://${host}:${port}/auth/verify?key=${dto.key}`;

    const templatePath = path.resolve(__dirname, '../../src/mail/templates/verification-email.html');
    const source = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(source);

    // Send the email with the verification link
    this.mailerService.sendMail({
      from: `"Intelligent Image Analyzer" <${this.configService.get<string>('MAIL_USER')}>`,
      to: dto.resiverEmail,
      subject: 'Verification Mail',
      html: template({ url }),
    });
  }
}
