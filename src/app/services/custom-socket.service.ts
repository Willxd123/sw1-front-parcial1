import { Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io';

const config: SocketIoConfig = { url: 'http://localhost:3000', options: {} };

@Injectable({
  providedIn: 'root',  // Esto hace que el servicio sea standalone
})
export class CustomSocket extends Socket {
  constructor() {
    super(config);  // Configuración de la URL del servidor Socket.io
  }
}
