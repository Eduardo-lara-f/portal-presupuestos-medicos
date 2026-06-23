"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const port = Number(process.env.PORT || 3001);
    app.enableCors({
        origin: [frontendUrl],
        credentials: true,
    });
    await app.listen(port, '0.0.0.0');
    console.log(`API corriendo en puerto ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map