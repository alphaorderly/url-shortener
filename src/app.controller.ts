import {
  Controller,
  Delete,
  Get,
  Post,
  Render,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Request, Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  @UseGuards(JwtAuthGuard)
  async index(@Req() req) {
    const userID = req.user.userId;

    const shortenedURLs = await this.appService.getAllShortenedURLs(userID);

    return {
      targetUrl: process.env.TARGET_URL,
      shortenedURLs: shortenedURLs,
      target: process.env.TARGET_URL,
    };
  }

  @Get('/:shortenedURL')
  async redirectToOriginalURL(@Req() req: Request, @Res() res: Response) {
    const shortenedURL = req.params.shortenedURL as string;

    const originalURL = await this.appService.getOriginalURL(shortenedURL);

    return res.redirect(originalURL);
  }

  @Post('/:shortenedURL')
  async redirectToOriginalURLWithPassword(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const password = req.body.password;

    const originalURL = await this.appService.getPasswordProtectedUrl(
      req.params.shortenedURL,
      password,
    );

    return res.redirect(originalURL);
  }

  @Delete('/:urlID')
  @UseGuards(JwtAuthGuard)
  async deleteShortenedURL(@Req() req, @Res() res: Response) {
    const userID = req.user.userId as number;
    const urlID = req.params.urlID as number;

    const response = await this.appService.deleteShortenedURL(urlID, userID);

    if (response.affected === 0) {
      return res.status(404).json('해당 URL을 찾을수 없습니다. URL not found.');
    } else {
      return res
        .status(200)
        .json('URL이 성공적으로 삭제되었습니다. URL deleted.');
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async shortenURL(@Req() req, @Res() res: Response) {
    const userID = req.user.userId;
    const originalURL = req.body.url;
    const expire = req.body.expiryDate;
    const password = req.body.password;
    const customURL = req.body.customURL;

    let expireDate: Date = null;
    if (expire !== null) {
      expireDate = new Date(expire);
    }

    const shortenedURL = await this.appService.shortenURL(
      originalURL,
      userID,
      expireDate,
      password,
      customURL,
    );

    return res.status(200).json(shortenedURL);
  }
}
