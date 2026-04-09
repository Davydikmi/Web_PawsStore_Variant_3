import { Component, signal } from '@angular/core';
import { HeaderComponent } from './header/header';
import { RouterOutlet, Router } from '@angular/router';
import {FooterComponent } from "./footer/footer";

@Component({
  selector: 'app-root',
  imports: [HeaderComponent, RouterOutlet, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('PawsStore');
}
