-- Base de datos: jjseafoods
-- Módulo: Recepción de Productos Pesqueros

CREATE TABLE IF NOT EXISTS proveedores (
  id_proveedor SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  ruc VARCHAR(20),
  telefono VARCHAR(20),
  direccion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recepciones (
  id_recepcion SERIAL PRIMARY KEY,
  numero_recepcion VARCHAR(20) UNIQUE NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  id_proveedor INTEGER REFERENCES proveedores(id_proveedor),
  procedencia VARCHAR(150),
  observaciones TEXT,
  responsable VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recepcion_detalle (
  id_detalle SERIAL PRIMARY KEY,
  id_recepcion INTEGER REFERENCES recepciones(id_recepcion) ON DELETE CASCADE,
  producto VARCHAR(100) NOT NULL,
  talla VARCHAR(20),
  calidad VARCHAR(10),
  peso1 NUMERIC(8,2),
  peso2 NUMERIC(8,2),
  peso3 NUMERIC(8,2),
  peso4 NUMERIC(8,2),
  peso5 NUMERIC(8,2),
  peso6 NUMERIC(8,2),
  peso7 NUMERIC(8,2),
  peso8 NUMERIC(8,2),
  peso9 NUMERIC(8,2),
  peso10 NUMERIC(8,2),
  peso_total NUMERIC(10,2),
  descuento_pct NUMERIC(5,2) DEFAULT 2.00,
  peso_neto NUMERIC(10,2)
);

CREATE TABLE IF NOT EXISTS condiciones_transporte (
  id_condicion SERIAL PRIMARY KEY,
  id_recepcion INTEGER REFERENCES recepciones(id_recepcion) ON DELETE CASCADE,
  transporte_limpio BOOLEAN DEFAULT FALSE,
  suficiente_hielo BOOLEAN DEFAULT FALSE,
  combustible_cerca BOOLEAN DEFAULT FALSE,
  animales_cerca BOOLEAN DEFAULT FALSE,
  objetos_cerca BOOLEAN DEFAULT FALSE
);

-- Datos de prueba
INSERT INTO proveedores (nombre, ruc, telefono, direccion)
VALUES
  ('Bryan Intriago', '0801234567001', '0991234567', 'Esmeraldas'),
  ('Scarleth Copete', '0809876543001', '0997654321', 'Esmeraldas'),
  ('Joao Cevillano', '0805555555001', '0993333333', 'Esmeraldas')
ON CONFLICT DO NOTHING;
