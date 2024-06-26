import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RegisterService } from './register.service';
import { RegisterUrlDto } from './dtos/registerUrl.dto';
import { Response } from 'express';
import { RegisterDto } from './dtos/register.dto';
import { RegisterErrorDto } from './dtos/registerError.dto';

@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Get('createurl')
  @UseGuards(JwtAuthGuard)
  createRegisterUrl() {
    const url = this.registerService.createRegisterUrl();

    return new RegisterUrlDto(url);
  }

  @Get('url/:url')
  async register(@Param('url') url: string, @Res() res: Response) {
    const check = await this.registerService.verifyRegisterUrl(url);

    if (!check) {
      throw new NotFoundException();
    }

    res.render('register');
  }

  @Post('signup')
  async registerUser(@Body() body: RegisterDto, @Res() res: Response) {
    const { id, password, url } = body;

    const user = await this.registerService.registerUser(id, password, url);

    if (user instanceof RegisterErrorDto) {
      res.status(400).send(user);
      return;
    } else {
      return res.status(201).send(user);
    }
  }
}
