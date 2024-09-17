import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { BoardComponent } from './pages/board/board.component';
import { WelcomeComponent } from './pages/client/welcome/welcome.component';
import { RoomsComponent } from './pages/client/rooms/rooms.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'client',
    component: WelcomeComponent,
  },
  {
    path: 'room/:code',
    component: RoomsComponent
  }, // Ruta dinámica para la sala
    {
    path: 'board',
    component: BoardComponent,
  },
];
