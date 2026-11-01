// Dados ilustrativos para ensaiar o fluxo. Não representam revendedores reais.
export const DEMO_POINTS = [
  { name: "Ponto de demonstração · Centro", address: "Praça Coronel Fernando Prestes, s/n, Centro", city: "Sorocaba", state: "SP", postalCode: "18010000", latitude: -23.4991, longitude: -47.4584 },
  { name: "Ponto de demonstração · Campolim", address: "Avenida Antônio Carlos Comitre, 1000, Campolim", city: "Sorocaba", state: "SP", postalCode: "18047000", latitude: -23.5259, longitude: -47.4675 },
  { name: "Ponto de demonstração · Santa Rosália", address: "Avenida São Paulo, 100, Santa Rosália", city: "Sorocaba", state: "SP", postalCode: "18013000", latitude: -23.4840, longitude: -47.4431 },
  { name: "Ponto de demonstração · Éden", address: "Avenida Independência, 1000, Éden", city: "Sorocaba", state: "SP", postalCode: "18087000", latitude: -23.4218, longitude: -47.4057 },
  { name: "Ponto de demonstração · Votorantim", address: "Avenida 31 de Março, 100, Centro", city: "Votorantim", state: "SP", postalCode: "18110000", latitude: -23.5400, longitude: -47.4450 },
  { name: "Ponto de demonstração · Itu", address: "Praça Padre Miguel, s/n, Centro", city: "Itu", state: "SP", postalCode: "13300000", latitude: -23.2639, longitude: -47.2992 },
] as const;
// CEPs verificados no provedor; os mesmos atalhos funcionam no modo sem chave.
export const DEMO_SEARCHES = [DEMO_POINTS[0], DEMO_POINTS[4], DEMO_POINTS[5]].map(point => ({
  label: point.name.replace("Ponto de demonstração · ", ""),
  query: point.postalCode.slice(0,5) + "-" + point.postalCode.slice(5),
}));

