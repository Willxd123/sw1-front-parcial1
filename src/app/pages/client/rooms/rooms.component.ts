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
  //relaciones
  private isAssociationMode: boolean = false; // Modo de asociación activado
  private firstSelectedNode: go.Node | null = null; // Primer nodo seleccionado
  //asociacion directa;
  selectedFromClassId: string | null = null; // Para almacenar la clase de origen
  selectedToClassId: string | null = null; // Para almacenar la clase de destino
  isDirectAssociationMode = false;
  isGeneralizationMode = false;
  isAggregationMode = false;
  isCompositionMode = false;
  isDependencyMode = false;
  //-----------
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
  selectedClassLocation: { top: number; left: number } | null = null;
  selectedClassSize: { width: number; height: number } | null = null;

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
    this.roomCode = this.route.snapshot.paramMap.get('code') || '';

    if (this.roomCode) {
      this.serverService.joinRoom(this.roomCode);
    }

    this.diagram = new go.Diagram(this.diagramDiv.nativeElement);
    this.initializeDiagram();

    //----------------tabla
    // Escuchar cuando se selecciona un nodo en el diagrama
    this.diagram.addDiagramListener('ObjectSingleClicked', (e) => {
      const part = e.subject.part;
      //asociacion
      if (this.isAssociationMode && part instanceof go.Node) {
        this.handleNodeClick(part);
      }
      // Si el modo de asociación directa está activado, manejar el clic
      if (this.isDirectAssociationMode && part instanceof go.Node) {
        this.handleDirectNodeClick(part);
      }

      // Si el modo de generalización está activado, manejar el clic
      if (this.isGeneralizationMode && part instanceof go.Node) {
        this.handleGeneralizationNodeClick(part);
      }
      // Si el modo de agregación está activado, manejar el clic
      if (this.isAggregationMode && part instanceof go.Node) {
        this.handleAggregationNodeClick(part);
      }
      // Si el modo de composición está activado, manejar el clic
      if (this.isCompositionMode && part instanceof go.Node) {
        this.handleCompositionNodeClick(part);
      }
      // Si el modo de dependencia está activado, manejar el clic
      if (this.isDependencyMode && part instanceof go.Node) {
        this.handleDependencyNodeClick(part);
      }
    });
    // Escuchar cuando se agregue una clase y actualizar el diagrama
    this.serverService.onClassAdded().subscribe((newClass) => {
      console.log('Clase recibida en el front-end:', newClass); // Verifica la recepción
      (this.diagram.model as go.GraphLinksModel).addNodeData(newClass);
      this.classList = this.diagram.model.nodeDataArray; // Actualizar la lista de clases
    });
    //--------------posicion
    // Escuchar cuando se agregue una clase y actualizar el diagrama
    this.serverService.onClassAdded().subscribe((newClass) => {
      console.log('Clase recibida en el front-end:', newClass);
      (this.diagram.model as go.GraphLinksModel).addNodeData(newClass);
      this.classList = this.diagram.model.nodeDataArray;
    });

    // Escuchar las actualizaciones de posición de clases desde el servidor
    this.serverService
      .onClassPositionAndSizeUpdated()
      .subscribe((updateData) => {
        const updatedClass = updateData.classData;
        const node = this.diagram.findNodeForKey(updatedClass.key);
        if (node) {
          // Actualiza la posición visual
          node.location = new go.Point(
            updatedClass.location.x,
            updatedClass.location.y
          );

          // Asegurarse de que la posición también se actualice en el modelo de GoJS
          this.diagram.model.setDataProperty(
            node.data,
            'location',
            updatedClass.location
          );

          console.log(
            `El usuario ${updateData.user} actualizó la posición de la clase con key ${updatedClass.key}.`
          );
        }
      });
    //nombre de la clase
    this.diagram.addDiagramListener('TextEdited', (e) => {
      const editedNode = e.subject.part; // La clase editada
      if (editedNode && editedNode.data) {
        const updatedName = e.subject.text;
        const classKey = editedNode.data.key;

        // Emitir el evento al servidor
        this.serverService.emitClassNameUpdate({
          roomCode: this.roomCode,
          classData: {
            key: classKey,
            name: updatedName,
          },
        });
      }
    });
    this.serverService.onClassNameUpdated().subscribe((updatedClassData) => {
      const classNode = this.diagram.findNodeForKey(updatedClassData.key);
      if (classNode) {
        // Actualizar el nombre de la clase en el diagrama
        this.diagram.model.setDataProperty(
          classNode.data,
          'name',
          updatedClassData.name
        );
        console.log(
          `El nombre de la clase con key ${updatedClassData.key} fue actualizado a: ${updatedClassData.name}`
        );
      }
    });

    this.diagram.addDiagramListener('ChangedSelection', (e) => {
      const selectedNode = this.diagram.selection.first();
      if (selectedNode) {
        this.selectedClass = selectedNode.data;
        this.updateNodePositionAndSize(selectedNode); // Actualizar ubicación y tamaño
      } else {
        this.selectedClass = null;
        this.clearNodePositionAndSize();
      }
      this.cdr.detectChanges();
    });

    // Listener para reflejar cambios mientras se mueve la clase
    this.diagram.addDiagramListener('SelectionMoved', (e) => {
      const selectedNode = this.diagram.selection.first();
      if (selectedNode) {
        // Emitir la actualización de posición al servidor
        this.serverService.emitClassPositionAndSizeUpdate({
          roomCode: this.roomCode,
          classData: {
            key: selectedNode.data.key,
            location: {
              x: selectedNode.location.x,
              y: selectedNode.location.y,
            },
          },
        });
      }
      this.cdr.detectChanges();
    });
    //-----------atributos-----------
    // Escuchar las actualizaciones de atributos desde el servidor
    this.serverService.onAttributeAdded().subscribe((updateData) => {
      const updatedClass = this.diagram.findNodeForKey(updateData.classKey);
      if (updatedClass) {
        updatedClass.data.attributes.push({
          name: `${updateData.attributeName} : ${updateData.attributeReturnType}`,
        });
        this.diagram.model.updateTargetBindings(updatedClass.data);
        console.log(
          `Atributo agregado a la clase con key ${updateData.classKey} por ${updateData.user}`
        );
      }
    });

    // Escuchar las actualizaciones de eliminación de atributos desde el servidor
    this.serverService.onAttributeRemoved().subscribe((updateData) => {
      const updatedClass = this.diagram.findNodeForKey(updateData.classKey);
      if (updatedClass) {
        // Eliminar el atributo del arreglo de atributos de la clase
        updatedClass.data.attributes = updatedClass.data.attributes.filter(
          (attribute: any) => attribute.name !== updateData.attributeName
        );
        this.diagram.model.updateTargetBindings(updatedClass.data);
        console.log(
          `Atributo eliminado de la clase con key ${updateData.classKey} por ${updateData.user}`
        );
      }
    });
    //-------metodo-----------
    // Escuchar las actualizaciones de métodos desde el servidor
    this.serverService.onMethodAdded().subscribe((updateData) => {
      const updatedClass = this.diagram.findNodeForKey(updateData.classKey);
      if (updatedClass) {
        updatedClass.data.methods.push({
          name: `${updateData.methodName} : ${updateData.methodReturnType}`,
        });
        this.diagram.model.updateTargetBindings(updatedClass.data);
        console.log(
          `Método agregado a la clase con key ${updateData.classKey} por ${updateData.user}`
        );
      }
    });
    // Escuchar las actualizaciones de eliminación de métodos desde el servidor
    this.serverService.onMethodRemoved().subscribe((updateData) => {
      const updatedClass = this.diagram.findNodeForKey(updateData.classKey);
      if (updatedClass) {
        // Eliminar el método del arreglo de métodos de la clase
        updatedClass.data.methods = updatedClass.data.methods.filter(
          (method: any) => method.name !== updateData.methodName
        );
        this.diagram.model.updateTargetBindings(updatedClass.data);
        console.log(
          `Método eliminado de la clase con key ${updateData.classKey} por ${updateData.user}`
        );
      }
    });

    //eliminar clase
    // Listener para detectar cuando se elimina un nodo con Backspace o Suprimir
    this.diagram.addDiagramListener('SelectionDeleted', (e) => {
      const deletedNode = e.subject.first(); // Nodo que ha sido eliminado
      if (deletedNode && deletedNode.data) {
        const classKey = deletedNode.data.key;

        // Emitir el evento al servidor
        this.serverService.emitDeleteClass({
          roomCode: this.roomCode,
          classKey: classKey,
        });
      }
    });
    this.serverService.onClassDeleted().subscribe((deletedClassKey) => {
      const nodeToDelete = this.diagram.findNodeForKey(deletedClassKey);
      if (nodeToDelete) {
        this.diagram.remove(nodeToDelete); // Eliminar el nodo del diagrama
        console.log(`La clase con key ${deletedClassKey} fue eliminada.`);
      }
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
        },new go.Binding('dashArray', 'relationType', (relationType) => {
          return relationType === 'Dependency' ? [5, 5] : null; // Solo para dependencia
        })), // Línea horizontal para separar

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
      this.makePort('T', go.Spot.Top, true, true), // Puerto superior
      this.makePort('L', go.Spot.Left, true, true), // Puerto izquierdo
      this.makePort('R', go.Spot.Right, true, true), // Puerto derecho
      this.makePort('B', go.Spot.Bottom, true, true) // Puerto inferior
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

      // Multiplicidad del origen editable
      go.GraphObject.make(
        go.TextBlock,
        {
          segmentIndex: 0,
          segmentOffset: new go.Point(NaN, NaN),
          editable: true,
          segmentOrientation: go.Link.OrientUpright,
        },
        new go.Binding('text', 'multiplicityFrom').makeTwoWay()
      ),
      // Texto editable en el centro del enlace
      go.GraphObject.make(
        go.TextBlock,
        {
          segmentFraction: 0.5,
          editable: true,
          alignmentFocus: go.Spot.Center, // Asegura que el texto esté centrado
        },
        new go.Binding('text', 'relationType').makeTwoWay() // Editable relationType
      ),

      go.GraphObject.make(
        go.TextBlock,
        {
          segmentIndex: -1,
          segmentOffset: new go.Point(NaN, NaN),
          editable: true,
          segmentOrientation: go.Link.OrientUpright,
        },
        new go.Binding('text', 'multiplicityTo').makeTwoWay()
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

  // Actualiza la posición y tamaño del nodo seleccionado
  updateNodePositionAndSize(node: go.Part) {
    this.selectedClassLocation = {
      top: node.location.y,
      left: node.location.x,
    };
    this.selectedClassSize = {
      width: node.actualBounds.width,
      height: node.actualBounds.height,
    };
    this.cdr.detectChanges();
  }

  // Limpia los valores de posición y tamaño cuando no hay selección
  clearNodePositionAndSize() {
    this.selectedClassLocation = null;
    this.selectedClassSize = null;
  }
  // Método para agregar una clase
  addClass() {
    const newClass = {
      key: this.diagram.model.nodeDataArray.length + 1,
      name: 'Nueva Clase',
      attributes: [],
      methods: [],
      location: '100,100',
    };

    // Emitir evento para agregar la clase a través de sockets
    this.serverService.emitAddClass({
      roomCode: this.roomCode, // Usa el código de la sala actual
      classData: newClass,
    });

    /* (this.diagram.model as go.GraphLinksModel).addNodeData(newClass); */
    this.classList = this.diagram.model.nodeDataArray; // Actualizar la lista de clases localmente
  }

  makePort(name: string, spot: go.Spot, output: boolean, input: boolean) {
    return go.GraphObject.make(go.Shape, 'Circle', {
      fill: 'transparent',
      strokeWidth: 0,
      width: 8,
      height: 8,
      alignment: spot,
      alignmentFocus: spot,
      portId: name,
      fromSpot: spot,
      toSpot: spot,
      fromLinkable: output,
      toLinkable: input,
      cursor: 'pointer',
    });
  }

  //Agregar atributos
  addAttribute() {
    const selectedClass = this.diagram.selection.first();
    if (selectedClass && this.attributeName && this.attributeReturnType) {
      const classData = selectedClass.data;

      // Emitir el evento para agregar el atributo al servidor
      this.serverService.emitAddAttribute({
        roomCode: this.roomCode,
        classKey: classData.key,
        attributeName: this.attributeName,
        attributeReturnType: this.attributeReturnType,
      });

      // Limpiar los campos de entrada
      this.attributeName = '';
      this.attributeReturnType = '';
    }
  }

  //Agregar metodos
  addMethod() {
    const selectedClass = this.diagram.selection.first();
    if (selectedClass && this.methodName && this.methodReturnType) {
      const classData = selectedClass.data;

      // Emitir el evento para agregar el método al servidor
      this.serverService.emitAddMethod({
        roomCode: this.roomCode,
        classKey: classData.key,
        methodName: this.methodName,
        methodReturnType: this.methodReturnType,
      });

      // Limpiar los campos de entrada
      this.methodName = '';
      this.methodReturnType = '';
    }
  }

  //Eliminar atributo
  removeAttribute(attributeName: string) {
    const selectedClass = this.diagram.selection.first();
    if (selectedClass) {
      const classData = selectedClass.data;

      // Emitir el evento para eliminar el atributo al servidor
      this.serverService.emitRemoveAttribute({
        roomCode: this.roomCode,
        classKey: classData.key,
        attributeName: attributeName,
      });

      // Limpiar la selección de atributo
      this.selectedAttribute = '';
    }
  }

  //Eliminar metodo
  removeMethod(methodName: string) {
    const selectedClass = this.diagram.selection.first();
    if (selectedClass) {
      const classData = selectedClass.data;

      // Emitir el evento para eliminar el método al servidor
      this.serverService.emitRemoveMethod({
        roomCode: this.roomCode,
        classKey: classData.key,
        methodName: methodName,
      });

      // Limpiar la selección de método
      this.selectedMethod = '';
    }
  }
  //-------------------------------
  //--------------------------------------Asociacion
  // Método para activar el modo de asociación
  enableAssociationMode() {
    this.isAssociationMode = true;
    this.firstSelectedNode = null;
    console.log('Modo de asociación activado. Selecciona dos nodos.');
  }

  // Método que maneja los clics en los nodos en modo de asociación
  handleNodeClick(node: go.Node) {
    if (!this.firstSelectedNode) {
      // Si no hay un primer nodo seleccionado, selecciona el primero
      this.firstSelectedNode = node;
      console.log('Primer nodo seleccionado:', node.data.key);
    } else {
      // Si ya hay un primer nodo seleccionado, selecciona el segundo y crea la asociación
      const secondSelectedNode = node;
      console.log('Segundo nodo seleccionado:', secondSelectedNode.data.key);

      // Llamar a la función createAssociation con los IDs de las dos clases
      this.createAssociation(
        this.firstSelectedNode.data.key.toString(),
        secondSelectedNode.data.key.toString(),
        '1', // Puedes cambiar esto según la multiplicidad que prefieras
        '1'
      );

      // Reiniciar el modo de asociación
      this.isAssociationMode = false;
      this.firstSelectedNode = null;
    }
  }

  createAssociation(
    fromClassId: string | null,
    toClassId: string | null,
    multiplicityFrom: string,
    multiplicityTo: string
  ): void {
    console.log('From Class ID:', fromClassId);
    console.log('To Class ID:', toClassId);

    if (fromClassId && toClassId) {
      const fromNode = this.diagram.findNodeForKey(Number(fromClassId));
      const toNode = this.diagram.findNodeForKey(Number(toClassId));

      if (fromNode && toNode) {
        const fromPortPos = fromNode
          .findPort('T')
          .getDocumentPoint(go.Spot.Center); // Puerto 'T' para Top
        const toPortPos = toNode.findPort('B').getDocumentPoint(go.Spot.Center); // Puerto 'B' para Bottom

        const linkData = {
          from: Number(fromClassId),
          to: Number(toClassId),
          fromPort: `${fromPortPos.x},${fromPortPos.y}`,
          toPort: `${toPortPos.x},${toPortPos.y}`,
          routing: go.Routing.Orthogonal,
          text: 'Asociación', // Etiqueta del enlace
          multiplicityFrom: multiplicityFrom || '',
          multiplicityTo: multiplicityTo || '',
          toArrow: '',
          relationType: 'Association',
        };

        const model = this.diagram.model as go.GraphLinksModel;
        try {
          model.addLinkData(linkData);
          console.log('Enlace creado:', model.linkDataArray);
        } catch (error) {
          console.error('Error al agregar el enlace:', error);
        }
      } else {
        console.error('No se encontraron los nodos de origen o destino.');
      }
    } else {
      alert('Por favor, seleccione las clases de origen y destino.');
    }
  }

  //--------------------------------------Asociacion Directa
  // Método para activar el modo de asociación directa
  enableDirectAssociationMode() {
    this.isDirectAssociationMode = true;
    this.firstSelectedNode = null;
    console.log('Modo de asociación directa activado. Selecciona dos nodos.');
  }
  // Método que maneja los clics en los nodos en modo de asociación directa
  handleDirectNodeClick(node: go.Node) {
    if (!this.firstSelectedNode) {
      // Si no hay un primer nodo seleccionado, selecciona el primero
      this.firstSelectedNode = node;
      console.log('Primer nodo seleccionado:', node.data.key);
    } else {
      // Si ya hay un primer nodo seleccionado, selecciona el segundo y crea la asociación directa
      const secondSelectedNode = node;
      console.log('Segundo nodo seleccionado:', secondSelectedNode.data.key);

      // Llamar a la función createAssociationDirect con los IDs de las dos clases
      this.createAssociationDirect(
        this.firstSelectedNode.data.key.toString(),
        secondSelectedNode.data.key.toString(),
        '1', // Multiplicidad desde la clase de origen
        '1' // Multiplicidad desde la clase de destino
      );

      // Reiniciar el modo de asociación directa
      this.isDirectAssociationMode = false;
      this.firstSelectedNode = null;
    }
  }
  createAssociationDirect(
    fromClassId: string | null,
    toClassId: string | null,
    multiplicityFrom: string,
    multiplicityTo: string
  ): void {
    console.log('From Class ID:', fromClassId);
    console.log('To Class ID:', toClassId);

    if (fromClassId && toClassId) {
      const fromNode = this.diagram.findNodeForKey(Number(fromClassId));
      const toNode = this.diagram.findNodeForKey(Number(toClassId));

      if (fromNode && toNode) {
        const fromPortPos = fromNode
          .findPort('T')
          .getDocumentPoint(go.Spot.Center); // Puerto 'T' para Top
        const toPortPos = toNode.findPort('B').getDocumentPoint(go.Spot.Center); // Puerto 'B' para Bottom

        const linkData = {
          from: Number(fromClassId),
          to: Number(toClassId),
          fromPort: `${fromPortPos.x},${fromPortPos.y}`,
          toPort: `${toPortPos.x},${toPortPos.y}`,
          routing: go.Routing.Orthogonal,
          text: 'Asociación directa', // Etiqueta del enlace
          multiplicityFrom: multiplicityFrom || '',
          multiplicityTo: multiplicityTo || '',
          toArrow: 'OpenTriangle',
          relationType: 'Association Direct',
        };

        const model = this.diagram.model as go.GraphLinksModel;
        try {
          model.addLinkData(linkData);
          console.log('Enlace creado:', model.linkDataArray);
        } catch (error) {
          console.error('Error al agregar el enlace:', error);
        }
      } else {
        console.error('No se encontraron los nodos de origen o destino.');
      }
    } else {
      alert('Por favor, seleccione las clases de origen y destino.');
    }
  }

  //-------------------------------------------------------Generalizacion
  // Método para activar el modo de generalización
  enableGeneralizationMode() {
    this.isGeneralizationMode = true;
    this.firstSelectedNode = null;
    console.log('Modo de generalización activado. Selecciona dos nodos.');
  }

  // Método que maneja los clics en los nodos en modo de generalización
  handleGeneralizationNodeClick(node: go.Node) {
    if (!this.firstSelectedNode) {
      // Si no hay un primer nodo seleccionado, selecciona el primero
      this.firstSelectedNode = node;
      console.log('Primer nodo seleccionado:', node.data.key);
    } else {
      // Si ya hay un primer nodo seleccionado, selecciona el segundo y crea la generalización
      const secondSelectedNode = node;
      console.log('Segundo nodo seleccionado:', secondSelectedNode.data.key);

      // Llamar a la función createGeneralization con los IDs de las dos clases
      this.createGeneralization(
        this.firstSelectedNode.data.key.toString(),
        secondSelectedNode.data.key.toString(),
        '', // Multiplicidad desde la clase de origen
        '' // Multiplicidad desde la clase de destino
      );

      // Reiniciar el modo de generalización
      this.isGeneralizationMode = false;
      this.firstSelectedNode = null;
    }
  }
  createGeneralization(
    fromClassId: string | null,
    toClassId: string | null,
    multiplicityFrom: string,
    multiplicityTo: string
  ): void {
    console.log('From Class ID:', fromClassId);
    console.log('To Class ID:', toClassId);

    if (fromClassId && toClassId) {
      const fromNode = this.diagram.findNodeForKey(Number(fromClassId));
      const toNode = this.diagram.findNodeForKey(Number(toClassId));

      if (fromNode && toNode) {
        const fromPortPos = fromNode
          .findPort('T')
          .getDocumentPoint(go.Spot.Center); // Puerto 'T' para Top
        const toPortPos = toNode.findPort('B').getDocumentPoint(go.Spot.Center); // Puerto 'B' para Bottom

        const linkData = {
          from: Number(fromClassId),
          to: Number(toClassId),
          fromPort: `${fromPortPos.x},${fromPortPos.y}`,
          toPort: `${toPortPos.x},${toPortPos.y}`,
          routing: go.Routing.Orthogonal,
          text: 'Asociación directa', // Etiqueta del enlace
          multiplicityFrom: multiplicityFrom || '',
          multiplicityTo: multiplicityTo || '',
          toArrow: 'RoundedTriangle',
          fill: 'transparent',
          relationType: 'Generalization',
        };

        const model = this.diagram.model as go.GraphLinksModel;
        try {
          model.addLinkData(linkData);
          console.log('Enlace creado:', model.linkDataArray);
        } catch (error) {
          console.error('Error al agregar el enlace:', error);
        }
      } else {
        console.error('No se encontraron los nodos de origen o destino.');
      }
    } else {
      alert('Por favor, seleccione las clases de origen y destino.');
    }
  }

  //--------------------------------Agregacion

  // Método para activar el modo de agregación
  enableAggregationMode() {
    this.isAggregationMode = true;
    this.firstSelectedNode = null;
    console.log('Modo de agregación activado. Selecciona dos nodos.');
  }

  // Maneja los clics en los nodos en modo de agregación
  handleAggregationNodeClick(node: go.Node) {
    if (!this.firstSelectedNode) {
      // Si no hay un primer nodo seleccionado, selecciona el primero
      this.firstSelectedNode = node;
      console.log('Primer nodo seleccionado:', node.data.key);
    } else {
      // Si ya hay un primer nodo seleccionado, selecciona el segundo y crea la agregación
      const secondSelectedNode = node;
      console.log('Segundo nodo seleccionado:', secondSelectedNode.data.key);

      // Llamar a la función createAggregation con los IDs de las dos clases
      this.createAggregation(
        this.firstSelectedNode.data.key.toString(),
        secondSelectedNode.data.key.toString(),
        '1', // Multiplicidad desde la clase de origen
        '1' // Multiplicidad desde la clase de destino
      );

      // Reiniciar el modo de agregación
      this.isAggregationMode = false;
      this.firstSelectedNode = null;
    }
  }
  createAggregation(
    fromClassId: string | null,
    toClassId: string | null,
    multiplicityFrom: string,
    multiplicityTo: string
  ): void {
    console.log('From Class ID:', fromClassId);
    console.log('To Class ID:', toClassId);

    if (fromClassId && toClassId) {
      const fromNode = this.diagram.findNodeForKey(Number(fromClassId));
      const toNode = this.diagram.findNodeForKey(Number(toClassId));

      if (fromNode && toNode) {
        const fromPortPos = fromNode
          .findPort('T')
          .getDocumentPoint(go.Spot.Center); // Puerto 'T' para Top
        const toPortPos = toNode.findPort('B').getDocumentPoint(go.Spot.Center); // Puerto 'B' para Bottom

        const linkData = {
          from: Number(fromClassId),
          to: Number(toClassId),
          fromPort: `${fromPortPos.x},${fromPortPos.y}`,
          toPort: `${toPortPos.x},${toPortPos.y}`,
          routing: go.Routing.Orthogonal,
          text: 'Agregation', // Etiqueta del enlace
          multiplicityFrom: multiplicityFrom || '',
          multiplicityTo: multiplicityTo || '',
          toArrow: 'StretchedDiamond',
          fill: 'transparent',
          relationType: 'Agregation',
        };

        const model = this.diagram.model as go.GraphLinksModel;
        try {
          model.addLinkData(linkData);
          console.log('Enlace creado:', model.linkDataArray);
        } catch (error) {
          console.error('Error al agregar el enlace:', error);
        }
      } else {
        console.error('No se encontraron los nodos de origen o destino.');
      }
    } else {
      alert('Por favor, seleccione las clases de origen y destino.');
    }
  }

  //-------------------------Composicion
  // Método para activar el modo de composición
  enableCompositionMode() {
    this.isCompositionMode = true;
    this.firstSelectedNode = null;
    console.log('Modo de composición activado. Selecciona dos nodos.');
  }

  // Maneja los clics en los nodos en modo de composición
  handleCompositionNodeClick(node: go.Node) {
    if (!this.firstSelectedNode) {
      // Si no hay un primer nodo seleccionado, selecciona el primero
      this.firstSelectedNode = node;
      console.log('Primer nodo seleccionado:', node.data.key);
    } else {
      // Si ya hay un primer nodo seleccionado, selecciona el segundo y crea la composición
      const secondSelectedNode = node;
      console.log('Segundo nodo seleccionado:', secondSelectedNode.data.key);

      // Llamar a la función createComposition con los IDs de las dos clases
      this.createComposition(
        this.firstSelectedNode.data.key.toString(),
        secondSelectedNode.data.key.toString(),
        '', // Multiplicidad desde la clase de origen
        '' // Multiplicidad desde la clase de destino
      );

      // Reiniciar el modo de composición
      this.isCompositionMode = false;
      this.firstSelectedNode = null;
    }
  }
  createComposition(
    fromClassId: string | null,
    toClassId: string | null,
    multiplicityFrom: string,
    multiplicityTo: string
  ): void {
    console.log('From Class ID:', fromClassId);
    console.log('To Class ID:', toClassId);

    if (fromClassId && toClassId) {
      const fromNode = this.diagram.findNodeForKey(Number(fromClassId));
      const toNode = this.diagram.findNodeForKey(Number(toClassId));

      if (fromNode && toNode) {
        const fromPortPos = fromNode
          .findPort('T')
          .getDocumentPoint(go.Spot.Center); // Puerto 'T' para Top
        const toPortPos = toNode.findPort('B').getDocumentPoint(go.Spot.Center); // Puerto 'B' para Bottom

        const linkData = {
          from: Number(fromClassId),
          to: Number(toClassId),
          fromPort: `${fromPortPos.x},${fromPortPos.y}`,
          toPort: `${toPortPos.x},${toPortPos.y}`,
          routing: go.Routing.Orthogonal,
          text: 'Composition', // Etiqueta del enlace
          multiplicityFrom: multiplicityFrom || '',
          multiplicityTo: multiplicityTo || '',
          toArrow: 'StretchedDiamond',
          relationType: 'Composition',
        };

        const model = this.diagram.model as go.GraphLinksModel;
        try {
          model.addLinkData(linkData);
          console.log('Enlace creado:', model.linkDataArray);
        } catch (error) {
          console.error('Error al agregar el enlace:', error);
        }
      } else {
        console.error('No se encontraron los nodos de origen o destino.');
      }
    } else {
      alert('Por favor, seleccione las clases de origen y destino.');
    }
  }

  //----------------dependencia-------------
  // Método para activar el modo de dependencia
  enableDependencyMode() {
    this.isDependencyMode = true;
    this.firstSelectedNode = null;
    console.log('Modo de dependencia activado. Selecciona dos nodos.');
  }

  // Manejar los clics en los nodos en modo de dependencia
  handleDependencyNodeClick(node: go.Node) {
    if (!this.firstSelectedNode) {
      // Si no hay un primer nodo seleccionado, selecciona el primero
      this.firstSelectedNode = node;
      console.log('Primer nodo seleccionado:', node.data.key);
    } else {
      // Si ya hay un primer nodo seleccionado, selecciona el segundo y crea la dependencia
      const secondSelectedNode = node;
      console.log('Segundo nodo seleccionado:', secondSelectedNode.data.key);

      // Llamar a la función createDependency con los IDs de las dos clases
      this.createDependency(
        this.firstSelectedNode.data.key.toString(),
        secondSelectedNode.data.key.toString(),
        '', // Multiplicidad del nodo origen
        '' // Multiplicidad del nodo destino
      );

      // Reiniciar el modo de dependencia
      this.isDependencyMode = false;
      this.firstSelectedNode = null;
    }
  }
  // Método para crear la relación de dependencia
createDependency(
  fromClassId: string | null,
  toClassId: string | null,
  multiplicityFrom: string,
  multiplicityTo: string
): void {
  console.log('From Class ID:', fromClassId);
  console.log('To Class ID:', toClassId);

  if (fromClassId && toClassId) {
    const fromNode = this.diagram.findNodeForKey(Number(fromClassId));
    const toNode = this.diagram.findNodeForKey(Number(toClassId));

    if (fromNode && toNode) {
      const fromPortPos = fromNode
        .findPort('T')
        .getDocumentPoint(go.Spot.Center); // Puerto 'T' para Top
      const toPortPos = toNode.findPort('B').getDocumentPoint(go.Spot.Center); // Puerto 'B' para Bottom

      const linkData = {
        from: Number(fromClassId),
        to: Number(toClassId),
        fromPort: `${fromPortPos.x},${fromPortPos.y}`,
        toPort: `${toPortPos.x},${toPortPos.y}`,
        routing: go.Routing.Orthogonal,
        text: 'Dependencia', // Etiqueta del enlace
        multiplicityFrom: multiplicityFrom || '',
        multiplicityTo: multiplicityTo || '',
        toArrow: 'OpenTriangle', // Flecha para dependencia
        relationType: 'Dependency',
      };

      const model = this.diagram.model as go.GraphLinksModel;
      try {
        model.addLinkData(linkData);
        console.log('Enlace de dependencia creado:', model.linkDataArray);
      } catch (error) {
        console.error('Error al agregar el enlace:', error);
      }
    } else {
      console.error('No se encontraron los nodos de origen o destino.');
    }
  } else {
    alert('Por favor, seleccione las clases de origen y destino.');
  }
}


  //Muchos a Muchos
  createManyToMany(
    fromClassId: string | null,
    toClassId: string | null,
    multiplicityFrom: string,
    multiplicityTo: string
  ): void {
    console.log('From Class ID:', fromClassId);
    console.log('To Class ID:', toClassId);

    if (fromClassId && toClassId) {
      const model = this.diagram.model as go.GraphLinksModel;

      //Crear el enlace principal entre las clases de origen y destino
      const mainLinkData = {
        from: Number(fromClassId),
        to: Number(toClassId),
        routing: go.Routing.Orthogonal,
        text: '',
        toArrow: '',
      };

      // Añadir el enlace principal
      model.addLinkData(mainLinkData);
      const lastLink = model.linkDataArray[model.linkDataArray.length - 1];

      //Clase Intermedia
      const intermediateClass = {
        key: model.nodeDataArray.length + 1,
        name: 'TablaIntermedia',
        attributes: [],
        methods: [],
        loc: '250 150', // Posición inicial del nodo intermedio
      };

      //Añadir el nodo intermedio al modelo
      model.addNodeData(intermediateClass);

      /*//Crear un enlace punteado desde el puerto en el centro del enlace principal hasta la tabla intermedia
      const midPointLinkData = {
        from: mainLinkData,  // Enlaza desde el puerto en el centro del enlace
        fromPort: "midPoint",  // Puerto en el centro del enlace principal
        to: intermediateClass.key,  // Tabla intermedia
        routing: go.Routing.Orthogonal,
        text: ""
      };

      // ñadir el enlace punteado entre el puerto central del enlace y la tabla intermedia
      model.addLinkData(midPointLinkData);*/
    } else {
      alert('Por favor, seleccione las clases de origen y destino.');
    }
  }
}
