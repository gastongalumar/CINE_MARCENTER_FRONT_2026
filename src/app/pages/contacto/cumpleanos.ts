import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cumpleanos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cumpleanos.html',
  styleUrls: ['./cumpleanos.css'],
})
export class CumpleanosComponent {
  readonly email = 'cines@cinespaseoaldrey.com.ar';

  readonly incluye = [
    {
      icon: 'local_activity',
      titulo: 'Entrada y Combo VIP',
      texto:
        'Cada invitado tiene asegurada su entrada para la peli elegida y un delicioso combo de pochoclos y gaseosa. ¡El clásico que no puede faltar!',
    },
    {
      icon: 'event_seat',
      titulo: 'Ubicaciones Exclusivas',
      texto:
        'Nada de andar buscando lugares a último momento. Tendrán asientos reservados juntos en las mejores ubicaciones de la sala.',
    },
    {
      icon: 'movie_filter',
      titulo: '¡Sorpresa en la Pantalla Grande!',
      texto:
        'Antes de que empiece la función, se proyectará un emotivo y divertido video con fotos del cumpleañero a la vista de todos. ¡Un momento único para sacarse fotos y emocionarse!',
    },
    {
      icon: 'group',
      titulo: 'Pase libre para los acompañantes',
      texto:
        'Para que la organización sea aún más fácil, el paquete incluye el ingreso de 2 adultos sin cargo.',
    },
    {
      icon: 'card_giftcard',
      titulo: 'El regalo de la casa',
      texto:
        'La magia no termina ese día. El cumpleañero se lleva 2 entradas gratis para volver al cine cuando quiera.',
    },
  ];
}
