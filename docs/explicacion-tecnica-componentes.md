# Explicación técnica de los componentes

## 1. Visión general
El sistema se construye como un monorepo para centralizar frontend, backend, tipos compartidos, modelo de base de datos y documentación técnica. Esta decisión reduce la dispersión del código, facilita la trazabilidad de cambios y permite mantener una arquitectura coherente durante el desarrollo del proyecto.

## 2. apps/web
Corresponde al frontend de la aplicación. Su responsabilidad es ofrecer la interfaz de usuario para autenticación, mantenedores, búsqueda de pacientes, emisión de presupuestos y revisión de resultados.

### app/
Contiene las rutas y pantallas principales. Aquí se ubican las vistas como login, dashboard, presupuestos, pacientes y mantenedores.

### components/
Agrupa los componentes reutilizables de interfaz, por ejemplo formularios, tablas, modales, botones, inputs y tarjetas de resumen. El objetivo es evitar duplicación visual y mantener consistencia en la experiencia de usuario.

### lib/
Incluye utilidades del frontend como cliente HTTP, funciones de formateo, validaciones simples y helpers de navegación. Sirve para separar lógica auxiliar de la capa visual.

## 3. apps/api
Corresponde al backend y concentra la lógica de negocio, las reglas del sistema y el acceso a la base de datos.

### main.ts
Es el punto de entrada de la API. Inicializa la aplicación y su configuración base.

### app.module.ts
Actúa como módulo raíz del backend. Desde aquí se ensamblan los módulos funcionales del sistema.

### modules/
Agrupa la lógica por dominio. Esta organización modular facilita el mantenimiento, la escalabilidad y la separación de responsabilidades.

#### auth/
Gestiona autenticación, autorización y validación de acceso.

#### patients/
Administra el registro y consulta de pacientes, incluyendo búsqueda por RUT y recuperación de información existente.

#### isapres/
Maneja el catálogo de isapres y, posteriormente, los planes vinculados a cada una.

#### procedures/
Administra las prestaciones médicas disponibles por división o cliente.

#### prices/
Gestiona los precios de prestaciones según el tipo de cobertura definido, por ejemplo isapre, plan, Fonasa o particular.

#### professionals/
Administra el equipo médico, diferenciando profesionales staff y externos, junto con sus datos básicos.

#### quotations/
Implementa el flujo central de emisión de presupuestos. Aquí se concentra la lógica de creación, cálculo, resumen, persistencia, envío y trazabilidad del presupuesto.

### prisma/
Contiene la integración del backend con Prisma. Aquí normalmente se ubica el servicio de conexión a base de datos y la inicialización del cliente ORM.

## 4. packages/shared
Corresponde a un paquete interno reutilizable por frontend y backend. Su función es compartir definiciones comunes para evitar inconsistencias.

### types/
Define tipos reutilizables como identificadores, estructuras base y modelos simples de intercambio.

### enums/
Define enumeraciones compartidas, por ejemplo tipos de atención, estados de presupuesto y tipos de cobertura. Esto ayuda a mantener alineados frontend y backend en los mismos valores de negocio.

## 5. prisma/
Centraliza el modelo de base de datos y su evolución.

### schema.prisma
Define el esquema de datos de la aplicación. Aquí se modelan las entidades principales, relaciones, restricciones y tipos de datos.

### seed.ts
Permite cargar datos de prueba para demostraciones, validaciones funcionales y desarrollo inicial. Es útil para crear divisiones demo, isapres, prestaciones y usuarios base.

## 6. docs/
Agrupa la documentación funcional y técnica. Sirve tanto para apoyar el desarrollo como para construir el informe final del proyecto.

### modelo-datos.md
Describe las entidades, relaciones, cardinalidades y reglas principales de persistencia.

### flujo-emision.md
Describe el proceso funcional de creación del presupuesto, desde el ingreso del paciente hasta la generación del PDF o envío por correo.

### explicacion-tecnica-componentes.md
Documento orientado al informe técnico, donde se justifica la arquitectura y se detalla la responsabilidad de cada componente del sistema.

## 7. Archivos raíz del monorepo

### package.json
Define scripts globales y dependencias compartidas del monorepo.

### pnpm-workspace.yaml
Declara los paquetes que forman parte del workspace. Permite instalar y resolver dependencias de manera unificada.

### turbo.json
Configura la ejecución de tareas del monorepo, por ejemplo desarrollo, build y lint. Ayuda a estandarizar procesos y optimizar ejecución entre proyectos.

### tsconfig.base.json
Define configuración común de TypeScript para todo el monorepo. Su propósito es mantener consistencia técnica entre frontend, backend y paquetes compartidos.

### .env.example
Documenta las variables de entorno que necesitará la solución, como conexión a base de datos, secreto JWT y URL pública del frontend o backend.

### README.md
Resume la finalidad del proyecto, su estructura general y las instrucciones básicas de inicialización.

## 8. Justificación arquitectónica
La división del proyecto en frontend, backend, paquete compartido, Prisma y documentación permite separar claramente responsabilidades. Esta estructura simplifica el mantenimiento, facilita pruebas y favorece la evolución incremental del sistema. Para un proyecto de título, además, permite explicar de manera clara cómo se organiza la solución y cómo se relacionan sus capas técnicas.

## 9. Justificación del monorepo
El monorepo permite mantener en un mismo repositorio todo el ecosistema de la aplicación. Esto facilita reutilizar tipos, reducir errores de integración entre frontend y backend, centralizar scripts de desarrollo y mantener una trazabilidad más clara del proyecto completo. En contextos académicos, también facilita la presentación, revisión y versionamiento del trabajo.
