import test from "node:test";
import assert from "node:assert/strict";
import { parseSearchRadius, searchNearbyPage, widerSearchRadii } from "../src/lib/locator/results.ts";

test("raio de busca usa 30 km por padrão e aceita somente os limites aprovados", () => {
  assert.equal(parseSearchRadius(undefined), 30);
  assert.equal(parseSearchRadius(30), 30);
  assert.equal(parseSearchRadius(50), 50);
  assert.equal(parseSearchRadius(100), 100);
  assert.throws(() => parseSearchRadius(40), /raio/i);
});

test("busca filtra pelo raio, ordena por distância e entrega cinco pontos por página", () => {
  const candidates = [
    { id: 1, distanceKm: 29 },
    { id: 2, distanceKm: 5 },
    { id: 3, distanceKm: 30 },
    { id: 4, distanceKm: 31 },
    { id: 5, distanceKm: 0 },
    { id: 6, distanceKm: 12 },
    { id: 7, distanceKm: 30.1 },
    { id: 8, distanceKm: 30 },
  ];

  assert.deepEqual(searchNearbyPage(candidates, 30, 0), {
    points: [
      { id: 5, distanceKm: 0 },
      { id: 2, distanceKm: 5 },
      { id: 6, distanceKm: 12 },
      { id: 1, distanceKm: 29 },
      { id: 3, distanceKm: 30 },
    ],
    total: 6,
    hasMore: true,
  });

  assert.deepEqual(searchNearbyPage(candidates, 30, 5), {
    points: [{ id: 8, distanceKm: 30 }],
    total: 6,
    hasMore: false,
  });
});

test("raio de 100 km exclui pontos acima do limite", () => {
  const candidates = [
    { id: 1, distanceKm: 100 },
    { id: 2, distanceKm: 100.01 },
  ];

  assert.deepEqual(searchNearbyPage(candidates, 100, 0), {
    points: [{ id: 1, distanceKm: 100 }],
    total: 1,
    hasMore: false,
  });
});

test("só oferece os raios maiores que ainda estão disponíveis", () => {
  assert.deepEqual(widerSearchRadii(30), [50, 100]);
  assert.deepEqual(widerSearchRadii(50), [100]);
  assert.deepEqual(widerSearchRadii(100), []);
});

test("paginação recusa deslocamento negativo", () => {
  assert.throws(() => searchNearbyPage([], 30, -1), /deslocamento/i);
});
