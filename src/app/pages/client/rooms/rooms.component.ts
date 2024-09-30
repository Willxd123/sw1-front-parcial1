import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ServerService } from '../../../services/server.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as go from 'gojs';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { NavegationComponent } from '../../../components/navegation/navegation.component';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    NavegationComponent,
    RouterModule,
  ], // Asegúrate de agregar estos módulos
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css'],
})
export class RoomsComponent implements OnInit {
  roomCode: string = ''; // Código de la sala que obtenemos de la URL
  roomName: string = ''; // Nombre de la sala que obtenemos del backend
  roomId: number = 0; // ID de la sala, obtenido al unirse
  errorMessage: string = ''; // Para manejar errores
  usersInRoom: any[] = []; // Almacena los usuarios que se unen
  //-----------------------------diagramas------------------------------
  @ViewChild('diagramDiv', { static: true }) diagramDiv!: ElementRef;
  public diagram!: go.Diagram;
  attributeName: string = ''; // Nombre del atributo select
  methodName: string = ''; // Nombre del método select
  selectedAttribute: string = ''; //Nombre del atributoDelete select
  selectedMethod: string = ''; //Nombre del metodoDelete select

  methodReturnType: string = ''; // Tipo de retorno por defecto para métodos
  attributeReturnType: string = ''; // Tipo de retorno por defecto para atributos

  fromClassId: string | null = null; // Clase de origen
  toClassId: string | null = null; // Clase de destino
  multiplicityFrom: string = ''; // Multiplicidad por defecto origen
  multiplicityTo: string = ''; // Multiplicidad por defecto destino

  classList: any[] = []; // Lista de clases (nodos) disponibles para seleccionar
  //------tabla
  newAttribute: string = '';
  newMethod: string = '';

  selectedClass: any = null; // Clase seleccionada
  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private router: Router,

    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    //oyente de nuevo usuario conectado
    this.serverService.joinRoom(this.roomCode);

    this.diagram = new go.Diagram(this.diagramDiv.nativeElement);
    this.initializeDiagram();

    //----------------tabla
    // Listener para actualizar el nombre de la clase seleccionada
    this.diagram.addDiagramListener('ChangedSelection', (e) => {
      const selectedNode = this.diagram.selection.first();
      if (selectedNode) {
        this.selectedClass = selectedNode.data;
      } else {
        this.selectedClass = null;
      }
      this.cdr.detectChanges(); // Refresh the view
    });

  }
  //Inicializar el diagrama
  initializeDiagram() {
    this.diagram.nodeTemplate = go.GraphObject.make(
      go.Node,
      'Auto',
      go.GraphObject.make(go.Shape, 'Rectangle', {
        fill: '#FFFFE0',
        stroke: 'black',
        strokeWidth: 1,
        portId: '',
      }),
      go.GraphObject.make(
        go.Panel,
        'Vertical',
        { margin: 5 },

        // Nombre de la clase
        go.GraphObject.make(
          go.TextBlock,
          {
            font: 'bold 11pt sans-serif',
            margin: new go.Margin(5, 0, 5, 0),
            editable: true,
          },
          new go.Binding('text', 'name').makeTwoWay()
        ),

        go.GraphObject.make(go.Shape, 'LineH', {
          strokeWidth: 1,
          maxSize: new go.Size(NaN, 10),
        }), // Línea horizontal para separar

        // Panel para atributos
        go.GraphObject.make(
          go.Panel,
          'Vertical',
          new go.Binding('itemArray', 'attributes'),
          {
            itemTemplate: go.GraphObject.make(
              go.Panel,
              'Horizontal',
              go.GraphObject.make(
                go.TextBlock,
                {
                  margin: new go.Margin(5, 0, 5, 0),
                  editable: true,
                },
                new go.Binding('text', 'name').makeTwoWay()
              )
            ),
          }
        ),

        go.GraphObject.make(go.Shape, 'LineH', {
          strokeWidth: 1,
          maxSize: new go.Size(NaN, 10),
        }), // Otra línea horizontal

        // Panel para métodos
        go.GraphObject.make(
          go.Panel,
          'Vertical',
          new go.Binding('itemArray', 'methods'),
          {
            itemTemplate: go.GraphObject.make(
              go.Panel,
              'Horizontal',
              go.GraphObject.make(
                go.TextBlock,
                {
                  margin: new go.Margin(5, 0, 5, 0),
                  editable: true,
                },
                new go.Binding('text', 'name').makeTwoWay()
              )
            ),
          }
        )
      ),

      // Añadir puertos en el nodo (Top, Left, Right, Bottom)
     /*  this.makePort('T', go.Spot.Top, true, true), // Puerto superior
      this.makePort('L', go.Spot.Left, true, true), // Puerto izquierdo
      this.makePort('R', go.Spot.Right, true, true), // Puerto derecho
      this.makePort('B', go.Spot.Bottom, true, true) // Puerto inferior */
    );

    // Configurar el template de los enlaces
    this.diagram.linkTemplate = go.GraphObject.make(
      go.Link,
      {
        routing: go.Link.Orthogonal, // Esto asegura que las líneas sean ortogonales
        corner: 5, // Bordes redondeados
        relinkableFrom: true,
        relinkableTo: true,
        reshapable: true, // Permite modificar la forma del enlace
        resegmentable: true, // Permite ajustar los segmentos del enlace
      },
      go.GraphObject.make(go.Shape, { stroke: 'black', strokeWidth: 1 }), // Línea del enlace

      // Flecha destino y su relleno
      go.GraphObject.make(
        go.Shape,
        new go.Binding('toArrow', 'toArrow'),
        new go.Binding('fill', 'fill')
      ),

      // TextBlock para el texto en el enlace
      go.GraphObject.make(
        go.TextBlock,
        {
          segmentIndex: 0,
          segmentOffset: new go.Point(NaN, NaN),
          editable: true,
          segmentOrientation: go.Orientation.Upright,
        },
        new go.Binding('text', 'multiplicityFrom')
      ),

      go.GraphObject.make(
        go.TextBlock,
        {
          segmentIndex: 0,
          segmentFraction: 0.5,
          editable: true,
        },
        new go.Binding('text', 'text')
      ),

      go.GraphObject.make(
        go.TextBlock,
        {
          segmentIndex: -1,
          segmentOffset: new go.Point(NaN, NaN),
          editable: true,
          segmentOrientation: go.Orientation.Upright,
        },
        new go.Binding('text', 'multiplicityTo')
      )
    );

    // Inicializar el modelo con algunas clases de prueba
    /*const initialClasses = [
      { key: 1, name: 'Clase1', attributes: [{ name: 'atributo1' }], methods: [{ name: 'metodo1' }], location: '100 100' },
      { key: 2, name: 'Clase2', attributes: [], methods: [], location: '300 100' }
    ];*/

    // Modelo inicial sin enlaces
    //this.diagram.model = new go.GraphLinksModel(initialClasses, []);
    this.diagram.model = new go.GraphLinksModel();
    //this.classList = initialClasses;

    //console.log('Clases disponibles:', this.classList);
    // Agregar listener para capturar los enlaces creados

    this.diagram.addDiagramListener('LinkDrawn', (e) => {
      const link = e.subject;
      const fromPort = link.fromPort;
      const toPort = link.toPort;

      // Obtener las coordenadas de los puertos
      const fromPortPos = fromPort.getDocumentPoint(go.Spot.Center);
      const toPortPos = toPort.getDocumentPoint(go.Spot.Center);

      const linkData = {
        from: Number(this.fromClassId), // ID de la clase origen
        to: Number(this.toClassId), // ID de la clase destino
        fromPort: `${fromPortPos.x},${fromPortPos.y}`, // Posición del puerto origen
        toPort: `${toPortPos.x},${toPortPos.y}`, // Posición del puerto destino
        routing: go.Routing.Orthogonal, // Tipo de ruta
        text: 'tiene', // Nombre de la relación
        multiplicityFrom: this.multiplicityFrom || '1', // Multiplicidad del origen
        multiplicityTo: this.multiplicityTo || '1', // Multiplicidad del destino
        toArrow: 'OpenTriangle', // Flecha del enlace (puedes cambiarlo según el tipo de relación)
        relationType: '', // Tipo de relación
      };

      // Actualizar el modelo del enlace con los datos de los puertos
      this.diagram.model.set(link.data, 'fromPort', linkData.fromPort);
      this.diagram.model.set(link.data, 'toPort', linkData.toPort);
    });
  }
  //---------------------------oyente del sidebar------------
  // Método para agregar una clase
  addClass() {
    const newClass = {
      key: this.diagram.model.nodeDataArray.length + 1,
      name: 'Nueva Clase',
      attributes: [],
      methods: [],
      location: '100,100',
    };
    (this.diagram.model as go.GraphLinksModel).addNodeData(newClass);
    this.classList = this.diagram.model.nodeDataArray; // Actualizar la lista de clases
    //this.sendDiagramUpdate();
  }

  //Agregar atributos
  addAttribute() {
    const selectedClass = this.diagram.selection.first();
    if (selectedClass && this.attributeName && this.attributeReturnType) {
      const classData = selectedClass.data;
      classData.attributes.push({
        name: `${this.attributeName} : ${this.attributeReturnType}`,
      });
      this.diagram.model.updateTargetBindings(classData); // Actualizar el nodo
      this.attributeName = ''; // Limpiar el campo nombre
      this.attributeReturnType = ''; // Limpiar el campo tipo
    }
  }

  //Agregar metodos
  addMethod() {
    const selectedClass = this.diagram.selection.first();
    if (selectedClass && this.methodName) {
      const classData = selectedClass.data;
      classData.methods.push({
        name: `${this.methodName} : ${this.methodReturnType}`,
      });
      this.diagram.model.updateTargetBindings(classData); // Actualizar los enlaces
      this.methodName = ''; // Limpiar el campo
      this.methodReturnType = ''; // Limpiar el campo tipo
    }
  }

  //Eliminar atributo
  removeAttribute(attributeName: string) {
    const selectedClass = this.diagram.selection.first();
    if (selectedClass) {
      const classData = selectedClass.data;
      classData.attributes = classData.attributes.filter(
        (attribute: any) => attribute.name !== attributeName
      );
      // Actualizar los enlaces
      this.diagram.model.updateTargetBindings(classData);
      this.selectedAttribute = '';
    }
  }

  //Eliminar metodo
  removeMethod(methodName: string) {
    const selectedClass = this.diagram.selection.first();
    if (selectedClass) {
      const classData = selectedClass.data;
      classData.methods = classData.methods.filter(
        (method: any) => method.name !== methodName
      );
      // Actualizar los enlaces
      this.diagram.model.updateTargetBindings(classData);
      this.selectedMethod = '';
    }
  }
}
