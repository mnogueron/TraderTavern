import { ApiProperty } from '@nestjs/swagger';

export class AltmanScorePointDto {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  score: number;

  constructor(date: Date, score: number) {
    this.date = date;
    this.score = score;
  }
}

export class AltmanHistoryDto {
  @ApiProperty()
  ticker: string;

  @ApiProperty({ type: AltmanScorePointDto, isArray: true })
  history: AltmanScorePointDto[];

  constructor(ticker: string, history: AltmanScorePointDto[]) {
    this.ticker = ticker;
    this.history = history;
  }
}
