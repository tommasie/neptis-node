-- CITY
DROP TABLE IF EXISTS CITY CASCADE;
create table CITY
(
	ID SERIAL primary key,
	NAME varchar(50) not null,
	REGION varchar(50) not null,
	UNIQUE (NAME, REGION)
);

DROP TABLE IF EXISTS ATTRACTION_C CASCADE;
create table ATTRACTION_C
(
	ID bigserial primary key,
	NAME varchar(50) not null,
	CITY integer not null,
	LATITUDE varchar(10) not null,
	LONGITUDE varchar(10) not null,
	RADIUS smallint not null,
	RATING smallint not null,
	UNIQUE (NAME, CITY),
    FOREIGN KEY(CITY) REFERENCES CITY(ID)
);



-- MUSEUM
DROP TABLE IF EXISTS MUSEUM CASCADE;
create table MUSEUM
(
	ID SERIAL primary key,
	NAME varchar(50) not null,
	CITY integer not null,
	UNIQUE (NAME, CITY),
	FOREIGN KEY(CITY) REFERENCES CITY(ID)
);

DROP TABLE IF EXISTS AREA_M CASCADE;
create table AREA_M
(
	ID bigserial primary key,
	NAME varchar(50) not null,
	MUSEUM integer not null,
	UNIQUE (NAME, MUSEUM),
	FOREIGN KEY(MUSEUM) REFERENCES MUSEUM(ID)
);

DROP TABLE IF EXISTS ATTRACTION_M CASCADE;
create table ATTRACTION_M
(
	ID bigserial primary key,
	NAME varchar(50) not null,
	AREA_M bigint not null,
	RATING smallint not null,
	UNIQUE (NAME, AREA_M),
	FOREIGN KEY(AREA_M) REFERENCES AREA_M(ID)
);

-- ADMIN
DROP TABLE IF EXISTS CURATOR CASCADE;
create table CURATOR
(
	NAME varchar(50) not null,
	SURNAME varchar(50) not null,
	BADGEID varchar(50) primary key,
	EMAIL varchar(50) not null,
	PASSWORD varchar(50) not null
);



-- USER
DROP TABLE IF EXISTS TOURIST CASCADE;
create table TOURIST
(
	NAME varchar(50) not null,
	SURNAME varchar(50) not null,
	EMAIL varchar(50) primary key,
	PASSWORD varchar(50) not null
);



-- TCODA
DROP TABLE IF EXISTS T_QUEUE CASCADE;
create table T_QUEUE
(
	ID bigserial primary key,
	MINUTES int not null,
	ATTRACTION_C bigint,
	ATTRACTION_M bigint,
	AREA_M bigint,
	FOREIGN KEY(ATTRACTION_C) REFERENCES ATTRACTION_C(ID),
	FOREIGN KEY(ATTRACTION_M) REFERENCES ATTRACTION_M(ID),
	FOREIGN KEY(AREA_M) REFERENCES AREA_M(ID)
);



-- TVISITA
DROP TABLE IF EXISTS T_VISIT CASCADE;
create table T_VISIT
(
	ID bigserial primary key,
	MINUTES int not null,
	ATTRACTION_C bigint,
	ATTRACTION_M bigint,
	FOREIGN KEY(ATTRACTION_C) REFERENCES ATTRACTION_C(ID),
	FOREIGN KEY(ATTRACTION_M) REFERENCES ATTRACTION_M(ID)
);

-- TMOVEAT (attrazioni)
DROP TABLE IF EXISTS T_MOVE_ATTRACTION CASCADE;
create table T_MOVE_ATTRACTION
(
	ID bigserial primary key,
	MINUTES int not null,
	ATTRACTION_C1 bigint not null,
	ATTRACTION_C2 bigint not null,
	FOREIGN KEY(ATTRACTION_C1) REFERENCES ATTRACTION_C(ID),
	FOREIGN KEY(ATTRACTION_C2) REFERENCES ATTRACTION_C(ID)
);

-- TMOVEAR (aree)
DROP TABLE IF EXISTS T_MOVE_AREA CASCADE;
create table T_MOVE_AREA
(
	ID bigserial primary key,
	MINUTES int not null,
	AREA_M1 bigint not null,
	AREA_M2 bigint not null,
	FOREIGN KEY(AREA_M1) REFERENCES AREA_M(ID),
	FOREIGN KEY(AREA_M2) REFERENCES AREA_M(ID)
);

-- SENSING
DROP TABLE IF EXISTS SENSING CASCADE;
create table SENSING
(
	ID bigserial primary key,
	DATA TIMESTAMP not null,
	T_QUEUE bigint,
	T_VISIT bigint,
	T_MOVE_ATTRACTION bigint,
	T_MOVE_AREA bigint,
	FOREIGN KEY(T_QUEUE) REFERENCES T_QUEUE(ID),
	FOREIGN KEY(T_VISIT) REFERENCES T_VISIT(ID),
	FOREIGN KEY(T_MOVE_ATTRACTION) REFERENCES T_MOVE_ATTRACTION(ID),
	FOREIGN KEY(T_MOVE_AREA) REFERENCES T_MOVE_AREA(ID)
);

-- DROP INDEX ?
CREATE INDEX index_timestamp ON SENSING(DATA);
