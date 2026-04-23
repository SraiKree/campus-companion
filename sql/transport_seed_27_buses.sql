-- Transport seed: 9 routes, 30 drivers, 27 buses, multiple stops per route.
-- Safe to re-run: uses ON CONFLICT DO NOTHING on natural keys (name / license_number / bus_number).
-- Run AFTER transport_schema.sql has created the tables.

-- =========================================================================
-- Routes (9 total, spanning Hyderabad corridors around MLRIT Dundigal campus)
-- =========================================================================
INSERT INTO transport_routes (name, distance_km, fee_amount, status) VALUES
  ('Secunderabad – JNTU',        22.5, 18000, 'active'),
  ('Kukatpally – Miyapur',       18.0, 16000, 'active'),
  ('Ameerpet – Gachibowli',      26.0, 19500, 'active'),
  ('Uppal – Tarnaka',            32.0, 21000, 'active'),
  ('LB Nagar – Dilsukhnagar',    35.5, 22500, 'active'),
  ('Kompally – Medchal',         14.0, 14000, 'active'),
  ('Bowenpally – Alwal',         20.0, 17000, 'active'),
  ('Begumpet – Paradise',        24.0, 18500, 'active'),
  ('ECIL – AS Rao Nagar',        30.0, 20500, 'active')
ON CONFLICT (name) DO NOTHING;

-- =========================================================================
-- Drivers (30 — one per bus + 3 spares)
-- =========================================================================
INSERT INTO transport_drivers (full_name, phone, license_number, license_expiry, status) VALUES
  ('Ramesh Kumar',       '9876500001', 'TS-DL-001-2021', '2027-08-12', 'assigned'),
  ('Suresh Reddy',       '9876500002', 'TS-DL-002-2020', '2026-11-30', 'assigned'),
  ('Venkatesh Rao',      '9876500003', 'TS-DL-003-2019', '2026-05-20', 'assigned'),
  ('Mahesh Yadav',       '9876500004', 'TS-DL-004-2022', '2028-02-14', 'assigned'),
  ('Prakash Naidu',      '9876500005', 'TS-DL-005-2018', '2026-09-09', 'assigned'),
  ('Srinivas Gupta',     '9876500006', 'TS-DL-006-2020', '2027-03-22', 'assigned'),
  ('Ravi Teja',          '9876500007', 'TS-DL-007-2021', '2027-12-01', 'assigned'),
  ('Naresh Kumar',       '9876500008', 'TS-DL-008-2019', '2026-07-15', 'assigned'),
  ('Kiran Reddy',        '9876500009', 'TS-DL-009-2022', '2028-04-28', 'assigned'),
  ('Anand Rao',          '9876500010', 'TS-DL-010-2020', '2027-01-10', 'assigned'),
  ('Vijay Bhaskar',      '9876500011', 'TS-DL-011-2021', '2027-06-18', 'assigned'),
  ('Raju Goud',          '9876500012', 'TS-DL-012-2018', '2026-10-05', 'assigned'),
  ('Shankar Rao',        '9876500013', 'TS-DL-013-2019', '2026-12-21', 'assigned'),
  ('Lakshman Reddy',     '9876500014', 'TS-DL-014-2022', '2028-03-11', 'assigned'),
  ('Bhaskar Sharma',     '9876500015', 'TS-DL-015-2020', '2027-09-04', 'assigned'),
  ('Murali Krishna',     '9876500016', 'TS-DL-016-2021', '2027-11-17', 'assigned'),
  ('Prabhakar Rao',      '9876500017', 'TS-DL-017-2019', '2026-08-02', 'assigned'),
  ('Narayan Swamy',      '9876500018', 'TS-DL-018-2022', '2028-05-23', 'assigned'),
  ('Hari Babu',          '9876500019', 'TS-DL-019-2020', '2027-02-28', 'assigned'),
  ('Ganesh Kumar',       '9876500020', 'TS-DL-020-2021', '2027-07-14', 'assigned'),
  ('Yadagiri Reddy',     '9876500021', 'TS-DL-021-2018', '2026-06-06', 'assigned'),
  ('Srikanth Varma',     '9876500022', 'TS-DL-022-2019', '2026-12-29', 'assigned'),
  ('Anil Kumar',         '9876500023', 'TS-DL-023-2022', '2028-01-19', 'assigned'),
  ('Sanjay Reddy',       '9876500024', 'TS-DL-024-2020', '2027-04-07', 'assigned'),
  ('Dinesh Rao',         '9876500025', 'TS-DL-025-2021', '2027-10-22', 'assigned'),
  ('Venu Gopal',         '9876500026', 'TS-DL-026-2019', '2026-03-16', 'assigned'),
  ('Chandrashekar',      '9876500027', 'TS-DL-027-2022', '2028-06-01', 'assigned'),
  ('Rajender Singh',     '9876500028', 'TS-DL-028-2020', '2027-05-12', 'available'),
  ('Mohan Rao',          '9876500029', 'TS-DL-029-2021', '2027-08-30', 'available'),
  ('Krishna Murthy',     '9876500030', 'TS-DL-030-2018', '2026-04-25', 'available')
ON CONFLICT (license_number) DO NOTHING;

-- =========================================================================
-- Buses (27) — distribute 3 per route, driver matched by license order.
-- bus_number is the natural key; ON CONFLICT keeps this idempotent.
-- =========================================================================
INSERT INTO buses (bus_number, capacity, route_id, driver_id, status, notes)
SELECT
  v.bus_number,
  v.capacity,
  r.id,
  d.id,
  v.status,
  v.notes
FROM (VALUES
  -- bus_number, capacity, route_name,                 driver_license,      status,        notes
  ('MLR-01', 55, 'Secunderabad – JNTU',        'TS-DL-001-2021', 'active',      'AC, Volvo'),
  ('MLR-02', 50, 'Secunderabad – JNTU',        'TS-DL-002-2020', 'active',      'Non-AC'),
  ('MLR-03', 55, 'Secunderabad – JNTU',        'TS-DL-003-2019', 'active',      'AC'),

  ('MLR-04', 50, 'Kukatpally – Miyapur',       'TS-DL-004-2022', 'active',      'Non-AC'),
  ('MLR-05', 55, 'Kukatpally – Miyapur',       'TS-DL-005-2018', 'active',      'AC'),
  ('MLR-06', 50, 'Kukatpally – Miyapur',       'TS-DL-006-2020', 'maintenance', 'Engine service scheduled'),

  ('MLR-07', 55, 'Ameerpet – Gachibowli',      'TS-DL-007-2021', 'active',      'AC, Premium'),
  ('MLR-08', 55, 'Ameerpet – Gachibowli',      'TS-DL-008-2019', 'active',      'AC'),
  ('MLR-09', 50, 'Ameerpet – Gachibowli',      'TS-DL-009-2022', 'active',      'Non-AC'),

  ('MLR-10', 55, 'Uppal – Tarnaka',            'TS-DL-010-2020', 'active',      'AC'),
  ('MLR-11', 50, 'Uppal – Tarnaka',            'TS-DL-011-2021', 'active',      'Non-AC'),
  ('MLR-12', 55, 'Uppal – Tarnaka',            'TS-DL-012-2018', 'active',      'AC'),

  ('MLR-13', 55, 'LB Nagar – Dilsukhnagar',    'TS-DL-013-2019', 'active',      'AC'),
  ('MLR-14', 50, 'LB Nagar – Dilsukhnagar',    'TS-DL-014-2022', 'active',      'Non-AC'),
  ('MLR-15', 55, 'LB Nagar – Dilsukhnagar',    'TS-DL-015-2020', 'active',      'AC'),

  ('MLR-16', 45, 'Kompally – Medchal',         'TS-DL-016-2021', 'active',      'Mini coach'),
  ('MLR-17', 50, 'Kompally – Medchal',         'TS-DL-017-2019', 'active',      'Non-AC'),
  ('MLR-18', 45, 'Kompally – Medchal',         'TS-DL-018-2022', 'inactive',    'Awaiting insurance renewal'),

  ('MLR-19', 50, 'Bowenpally – Alwal',         'TS-DL-019-2020', 'active',      'Non-AC'),
  ('MLR-20', 55, 'Bowenpally – Alwal',         'TS-DL-020-2021', 'active',      'AC'),
  ('MLR-21', 50, 'Bowenpally – Alwal',         'TS-DL-021-2018', 'active',      'Non-AC'),

  ('MLR-22', 55, 'Begumpet – Paradise',        'TS-DL-022-2019', 'active',      'AC'),
  ('MLR-23', 50, 'Begumpet – Paradise',        'TS-DL-023-2022', 'active',      'Non-AC'),
  ('MLR-24', 55, 'Begumpet – Paradise',        'TS-DL-024-2020', 'active',      'AC'),

  ('MLR-25', 50, 'ECIL – AS Rao Nagar',        'TS-DL-025-2021', 'active',      'Non-AC'),
  ('MLR-26', 55, 'ECIL – AS Rao Nagar',        'TS-DL-026-2019', 'active',      'AC'),
  ('MLR-27', 50, 'ECIL – AS Rao Nagar',        'TS-DL-027-2022', 'active',      'Non-AC')
) AS v(bus_number, capacity, route_name, driver_license, status, notes)
JOIN transport_routes  r ON r.name = v.route_name
JOIN transport_drivers d ON d.license_number = v.driver_license
ON CONFLICT (bus_number) DO NOTHING;

-- =========================================================================
-- Route stops — realistic Hyderabad landmarks with pickup times.
-- UNIQUE(route_id, stop_order) keeps this idempotent.
-- =========================================================================
INSERT INTO transport_route_stops (route_id, stop_name, landmark, pickup_time, stop_order)
SELECT r.id, s.stop_name, s.landmark, s.pickup_time::time, s.stop_order
FROM (VALUES
  -- route_name, stop_name, landmark, pickup_time, stop_order
  ('Secunderabad – JNTU', 'Secunderabad Station',   'East exit, Platform 1 entrance',  '06:45', 1),
  ('Secunderabad – JNTU', 'Paradise Circle',        'Near Paradise Biryani',           '07:00', 2),
  ('Secunderabad – JNTU', 'Patny Junction',         'Opposite HP petrol pump',         '07:10', 3),
  ('Secunderabad – JNTU', 'JNTU X-Roads',           'Under the metro pillar',          '07:30', 4),

  ('Kukatpally – Miyapur', 'Miyapur Metro',         'Bay 3, bus stand side',           '06:55', 1),
  ('Kukatpally – Miyapur', 'Hitech City Road',      'Forum Sujana Mall gate',          '07:10', 2),
  ('Kukatpally – Miyapur', 'KPHB Colony',           'Phase 1 arch',                    '07:20', 3),
  ('Kukatpally – Miyapur', 'Kukatpally Y-Junction', 'Manjeera Mall signal',            '07:30', 4),

  ('Ameerpet – Gachibowli', 'Ameerpet Metro',       'Exit A, Maitrivanam side',        '06:40', 1),
  ('Ameerpet – Gachibowli', 'Panjagutta',           'Care Hospital signal',            '06:55', 2),
  ('Ameerpet – Gachibowli', 'Jubilee Hills',        'Road No. 36 entrance',            '07:10', 3),
  ('Ameerpet – Gachibowli', 'Gachibowli Flyover',   'DLF junction',                    '07:25', 4),

  ('Uppal – Tarnaka', 'Uppal X-Roads',              'Metro station exit',              '06:30', 1),
  ('Uppal – Tarnaka', 'Habsiguda',                  'Opposite NGRI gate',              '06:45', 2),
  ('Uppal – Tarnaka', 'Tarnaka',                    'Tarnaka arch',                    '07:00', 3),
  ('Uppal – Tarnaka', 'Mettuguda',                  'Railway quarters',                '07:15', 4),

  ('LB Nagar – Dilsukhnagar', 'LB Nagar',           'Metro station, Bay 2',            '06:20', 1),
  ('LB Nagar – Dilsukhnagar', 'Chaitanyapuri',      'Victoria Memorial school',        '06:35', 2),
  ('LB Nagar – Dilsukhnagar', 'Dilsukhnagar',       'Conference hall bus bay',         '06:50', 3),
  ('LB Nagar – Dilsukhnagar', 'Malakpet',           'Malakpet Railway Stn road',       '07:05', 4),

  ('Kompally – Medchal', 'Medchal X-Roads',         'Outer Ring Road entry',           '07:15', 1),
  ('Kompally – Medchal', 'Kompally',                'Gundlapochampally signal',        '07:25', 2),
  ('Kompally – Medchal', 'Suchitra',                'Suchitra circle',                 '07:35', 3),

  ('Bowenpally – Alwal', 'Bowenpally',              'Bowenpally X-Roads',              '06:50', 1),
  ('Bowenpally – Alwal', 'Tirumalagiri',            'HAL guest house',                 '07:00', 2),
  ('Bowenpally – Alwal', 'Alwal',                   'Old police station',              '07:15', 3),
  ('Bowenpally – Alwal', 'Hakimpet',                'Air Force road',                  '07:25', 4),

  ('Begumpet – Paradise', 'Begumpet Station',       'West entrance',                   '06:45', 1),
  ('Begumpet – Paradise', 'Prakash Nagar',          'Under the flyover',               '06:55', 2),
  ('Begumpet – Paradise', 'SR Nagar',               'Near Metro pillar 203',           '07:05', 3),
  ('Begumpet – Paradise', 'Balkampet',              'YSR statue',                      '07:15', 4),

  ('ECIL – AS Rao Nagar', 'ECIL X-Roads',           'ECIL bus depot',                  '06:25', 1),
  ('ECIL – AS Rao Nagar', 'AS Rao Nagar',           'Community hall',                  '06:40', 2),
  ('ECIL – AS Rao Nagar', 'Kushaiguda',             'Main road, near ICICI',           '06:55', 3),
  ('ECIL – AS Rao Nagar', 'Neredmet',               'Cross-roads arch',                '07:10', 4)
) AS s(route_name, stop_name, landmark, pickup_time, stop_order)
JOIN transport_routes r ON r.name = s.route_name
ON CONFLICT (route_id, stop_order) DO NOTHING;
