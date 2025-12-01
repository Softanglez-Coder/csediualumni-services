import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService, GoogleUser } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { ConfigService } from '@nestjs/config';
import { UserDocument } from '../users/schemas/user.schema';

interface RequestWithUser extends Request {
  user: UserDocument;
}

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Request() req: RequestWithUser) {
    const result = await this.authService.googleLogin(req as GoogleUser);
    const frontendUrl = this.configService.get<string>('frontend.url');

    // Redirect to frontend with token
    return `
      <html>
        <body>
          <script>
            window.opener.postMessage(${JSON.stringify(result)}, '${frontendUrl}');
            window.close();
          </script>
          <p>Authentication successful. This window will close automatically...</p>
        </body>
      </html>
    `;
  }
}
