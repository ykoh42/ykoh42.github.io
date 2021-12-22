import { Module, OnModuleInit } from '@nestjs/common';
import { HttpModule, HttpService } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly httpService: HttpService) {}

  onModuleInit() {
    // 요청 인터셉터 추가하기
    this.httpService.axiosRef.interceptors.request.use(
      (config) => {
        // 요청이 전달되기 전에 작업 수행
        return config;
      },
      (error) => {
        // 요청 오류가 있는 작업 수행
        return Promise.reject(error);
      },
    );

    // 응답 인터셉터 추가하기
    this.httpService.axiosRef.interceptors.response.use(
      (response) => {
        // 2xx 범위에 있는 상태 코드는 이 함수를 트리거 합니다.
        // 응답 데이터가 있는 작업 수행
        return response;
      },
      (error) => {
        // 2xx 외의 범위에 있는 상태 코드는 이 함수를 트리거 합니다.
        // 응답 오류가 있는 작업 수행
        return Promise.reject(error);
      },
    );
  }
}
