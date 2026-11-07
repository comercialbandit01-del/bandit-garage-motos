/**
 * BANDIT GARAGE — DADOS DO CONFIGURADOR DE MOTOCICLOS
 * Passo 1: O cliente escolhe um dos modelos da Bandit Garage.
 * Passo 2: O cliente escolhe os acessórios na lista de acessórios em cada um dos 12 tópicos de produto existentes.
 * Passo 3: Revisão do Render 8K e submissão do pedido de cotação ao Backoffice Bandit App.
 */

window.CONFIGURATOR_MODELS = [
  {
    id: "TFM_CAFE_RACER",
    category: "BANDIT_CAFE",
    categoryLabel: "Bandit Café",
    name: {
      pt: "Bandit Café Racer",
      en: "Bandit Café Racer",
      es: "Bandit Café Racer",
      fr: "Bandit Café Racer"
    },
    tagline: {
      pt: "Linhas puras, semiguidões e estética clássica de competição anos 60",
      en: "Pure lines, clip-on handlebars and 1960s road-racing stance",
      es: "Líneas puras, semimanillares y estética de competición años 60",
      fr: "Lignes pures, guidons bracelets et allure de compétition des années 60"
    },
    description: {
      pt: "Conversão purista Bandit Garage sobre base BMW R100 com forqueta invertida dourada, travagem dupla de alto desempenho, depósito preto mate e assento em pele conhaque.",
      en: "Purist Bandit Garage conversion on a BMW R100 platform featuring gold USD forks, high-performance dual front brakes, matte black tank and cognac leather seat.",
      es: "Conversión purista Bandit Garage sobre base BMW R100 con horquilla invertida dorada, doble disco delantero, depósito negro mate y asiento en piel coñac.",
      fr: "Transformation puriste Bandit Garage sur base BMW R100 avec fourche inversée dorée, double freinage haute performance, réservoir noir mat et selle cuir cognac."
    },
    image: "bandit-models/bandit-cafe-racer.jpg",
    defaultColors: { tank: "bandit_black", seat: "cognac_leather" }
  },
  {
    id: "TFM_VINTAGE_RACER",
    category: "BANDIT_CAFE",
    categoryLabel: "Bandit Café",
    name: {
      pt: "Bandit Vintage Racer",
      en: "Bandit Vintage Racer",
      es: "Bandit Vintage Racer",
      fr: "Bandit Vintage Racer"
    },
    tagline: {
      pt: "Carenagem frontal desportiva e inspiração nas grelhas clássicas de resistência",
      en: "Sculpted front bikini fairing and classic endurance racing inspiration",
      es: "Carenado frontal deportivo e inspiración en las parrillas clásicas",
      fr: "Tête de fourche profilée et inspiration des courses d'endurance classiques"
    },
    description: {
      pt: "BMW R100 Bandit Garage em verde oliva mate com carenagem bikini frontal moldada, avanços clip-on desportivos, espelhos bar-end e jantes raiadas pretas.",
      en: "Bandit Garage BMW R100 in matte olive green featuring a sculpted front bikini fairing, clip-on bars, bar-end mirrors and black spoked wheels.",
      es: "BMW R100 Bandit Garage en verde oliva mate con carenado bikini frontal, semimanillares deportivos, espejos bar-end y llantas de radios negras.",
      fr: "BMW R100 Bandit Garage en vert olive mat avec carénage bikini avant, guidons bracelets, rétroviseurs embout de guidon et jantes à rayons noires."
    },
    image: "bandit-models/bandit-vintage-racer.jpg",
    defaultColors: { tank: "british_green", seat: "cognac_leather" }
  },
  {
    id: "TFM_SCRAMBLER",
    category: "BANDIT_SCRAMBLER",
    categoryLabel: "Bandit Scrambler",
    name: {
      pt: "Bandit Scrambler",
      en: "Bandit Scrambler",
      es: "Bandit Scrambler",
      fr: "Bandit Scrambler"
    },
    tagline: {
      pt: "Espírito all-terrain, pneus mistos de tacos e assinatura Bandit Garage",
      en: "All-terrain attitude, knobby dual-sport tyres and signature Bandit stance",
      es: "Espíritu todo terreno, neumáticos de tacos y firma Bandit Garage",
      fr: "Esprit tout-terrain, pneus à crampons et signature Bandit Garage"
    },
    description: {
      pt: "BMW R100 Scrambler Bandit Garage com pintura azul meia-noite e filete branco, foles de suspensão clássicos, pneus mistos Continental TKC80 e banco em pele castanha.",
      en: "Bandit Garage BMW R100 Scrambler with midnight blue paint and white pinstripe, classic fork gaiters, Continental TKC80 knobby tyres and brown leather bench.",
      es: "BMW R100 Scrambler Bandit Garage con pintura azul medianoche y filete blanco, fuelles clásicos, neumáticos Continental TKC80 y asiento en piel marrón.",
      fr: "BMW R100 Scrambler Bandit Garage avec peinture bleu nuit et filet blanc, soufflets de fourche, pneus Continental TKC80 et selle en cuir marron."
    },
    image: "bandit-models/bandit-scrambler.jpg",
    defaultColors: { tank: "midnight_blue", seat: "cognac_leather" }
  },
  {
    id: "TFM_RALLY_RAID",
    category: "BANDIT_SCRAMBLER",
    categoryLabel: "Bandit Scrambler",
    name: {
      pt: "Bandit Rally Raid",
      en: "Bandit Rally Raid",
      es: "Bandit Rally Raid",
      fr: "Bandit Rally Raid"
    },
    tagline: {
      pt: "Forqueta invertida dourada, pneus TKC80 e preparação todo-o-terreno",
      en: "Gold USD forks, TKC80 rubber and heavy-duty off-road engineering",
      es: "Horquilla invertida dorada, neumáticos TKC80 y preparación todo terreno",
      fr: "Fourche inversée dorée, pneus TKC80 et préparation tout-terrain"
    },
    description: {
      pt: "Construção Bandit Garage preparada para terra e asfalto com suspensão dianteira invertida USD dourada, discos recortados wave, pneus cardados de alto perfil e depósito mate.",
      en: "Built for dirt and tarmac with gold inverted USD front forks, wave brake rotors, high-profile knobby tyres and matte finish fuel tank.",
      es: "Construcción Bandit Garage para tierra y asfalto con horquilla invertida USD dorada, discos wave y neumáticos de tacos.",
      fr: "Préparation Bandit Garage terre et asphalte avec fourche inversée USD dorée, disques wave et pneus à crampons."
    },
    image: "bandit-models/bandit-rally-raid.jpg",
    defaultColors: { tank: "desert_sand", seat: "chocolate_leather" }
  },
  {
    id: "TFM_BRAT_STYLE",
    category: "BANDIT_URBAN",
    categoryLabel: "Bandit Urban",
    name: {
      pt: "Bandit Brat Style",
      en: "Bandit Brat Style",
      es: "Bandit Brat Style",
      fr: "Bandit Brat Style"
    },
    tagline: {
      pt: "Depósito em metal escovado, pneus clássicos e traseira curta minimalista",
      en: "Brushed raw metal fuel tank, vintage tyres and cropped rear loop",
      es: "Depósito en metal cepillado, neumáticos clásicos y trasera recortada",
      fr: "Réservoir en métal brossé, pneus vintage et boucle arrière courte"
    },
    description: {
      pt: "BMW Boxer Bandit Garage com depósito em aço escovado acetinado, subquadro encurtado com assento canelado preto, pneus clássicos Firestone Deluxe Champion e motor totalmente negro.",
      en: "Bandit Garage BMW Boxer featuring a satin brushed steel tank, shortened subframe with ribbed black seat, Firestone Deluxe Champion tyres and blacked-out engine.",
      es: "BMW Boxer Bandit Garage con depósito en acero cepillado satinado, subchasis corto con asiento estriado negro y motor negro.",
      fr: "BMW Boxer Bandit Garage avec réservoir en acier brossé satiné, boucle arrière courte, selle côtelée noire et moteur noir."
    },
    image: "bandit-models/bandit-brat-style.jpg",
    defaultColors: { tank: "classic_silver", seat: "black_nautical" }
  },
  {
    id: "TFM_BOBBER",
    category: "BANDIT_URBAN",
    categoryLabel: "Bandit Urban",
    name: {
      pt: "Bandit Bobber",
      en: "Bandit Bobber",
      es: "Bandit Bobber",
      fr: "Bandit Bobber"
    },
    tagline: {
      pt: "Assento solo flutuante em pele e silhueta muscular rebaixada",
      en: "Floating leather solo saddle and muscular low-slung silhouette",
      es: "Asiento solo flotante en piel y silueta muscular rebajada",
      fr: "Selle solo flottante en cuir et silhouette musclée surbaissée"
    },
    description: {
      pt: "BMW R100 Bobber Bandit Garage em verde tropa texturado com almofadas de joelho e selim solo cantilever em pele castanha pespontada em diamante, guarda-lamas curto e pneus largos.",
      en: "Bandit Garage BMW R100 Bobber in textured olive drab with knee pads, floating cantilever solo saddle in diamond-stitched brown leather and fat tyres.",
      es: "BMW R100 Bobber Bandit Garage en verde texturizado con asiento solo cantilever en piel marrón con costura diamante y neumáticos anchos.",
      fr: "BMW R100 Bobber Bandit Garage en vert texturé avec selle solo cantilever en cuir marron matelassé losange et pneus larges."
    },
    image: "bandit-models/bandit-bobber.jpg",
    defaultColors: { tank: "british_green", seat: "cognac_leather" }
  },
  {
    id: "TFM_STREET_TRACKER",
    category: "BANDIT_URBAN",
    categoryLabel: "Bandit Urban",
    name: {
      pt: "Bandit Street Tracker",
      en: "Bandit Street Tracker",
      es: "Bandit Street Tracker",
      fr: "Bandit Street Tracker"
    },
    tagline: {
      pt: "Contraste agressivo preto mate e pele vermelho carmim artesanal",
      en: "Aggressive matte black contrast with handcrafted crimson red leather",
      es: "Contraste agresivo negro mate y piel rojo carmín artesanal",
      fr: "Contraste agressif noir mat et cuir rouge carmin artisanal"
    },
    description: {
      pt: "BMW R100 Street Tracker da Bandit Garage com depósito preto mate texturado, joelheiras e banco em pele vermelha artesanal, forqueta invertida preta e postura ágil.",
      en: "Bandit Garage BMW R100 Street Tracker with textured matte black tank, handcrafted crimson red leather seat and knee pads, and black USD forks.",
      es: "BMW R100 Street Tracker de Bandit Garage con depósito negro mate, asiento en piel roja artesanal y horquilla invertida negra.",
      fr: "BMW R100 Street Tracker Bandit Garage avec réservoir noir mat, selle en cuir rouge carmin et fourche inversée noire."
    },
    image: "bandit-models/bandit-street-tracker.jpg",
    defaultColors: { tank: "bandit_black", seat: "crimson_red" }
  },
  {
    id: "TFM_CLASSIC",
    category: "BANDIT_CLASSIC",
    categoryLabel: "Bandit Classic",
    name: {
      pt: "Bandit Classic",
      en: "Bandit Classic",
      es: "Bandit Classic",
      fr: "Bandit Classic"
    },
    tagline: {
      pt: "Preto brilhante com filetes duplos clássicos e elegância Boxer",
      en: "Mirror gloss black with classic twin pinstripes and Boxer elegance",
      es: "Negro brillante con fileteado doble clásico y elegancia Boxer",
      fr: "Noir brillant avec double filet classique et élégance Boxer"
    },
    description: {
      pt: "Restauro custom Bandit Garage fiel às linhas clássicas da BMW R100, com pintura preta espelhada e filete duplo manual, jantes raiadas pretas e acabamentos de joalharia mecânica.",
      en: "Bespoke Bandit Garage restomod faithful to classic BMW R100 lines, with mirror-black paint, hand-laid twin pinstripes and mechanical jewellery finishes.",
      es: "Restauración custom Bandit Garage fiel a las líneas clásicas de la BMW R100 con pintura negra brillante y doble fileteado manual.",
      fr: "Restauration custom Bandit Garage fidèle aux lignes classiques BMW R100 avec peinture noire miroir et double filet peint à la main."
    },
    image: "bandit-models/bandit-classic.jpg",
    defaultColors: { tank: "bandit_black", seat: "black_nautical" }
  },
  {
    id: "TFM_CUSTOM_ROADSTER",
    category: "BANDIT_CLASSIC",
    categoryLabel: "Bandit Classic",
    name: {
      pt: "Bandit Custom Roadster",
      en: "Bandit Custom Roadster",
      es: "Bandit Custom Roadster",
      fr: "Bandit Custom Roadster"
    },
    tagline: {
      pt: "Equilíbrio intemporal entre postura clássica e pele artesanal conhaque",
      en: "Timeless balance between classic roadster stance and cognac leather",
      es: "Equilibrio atemporal entre postura clásica y piel artesanal coñac",
      fr: "Équilibre intemporel entre posture roadster classique et cuir cognac"
    },
    description: {
      pt: "BMW R100 Custom Roadster da Bandit Garage com depósito acetinado debruado a branco, punhos e assento em pele conhaque com costura diamante e mecânica Boxer revista.",
      en: "Bandit Garage BMW R100 Custom Roadster featuring a satin white-pinstriped tank, diamond-stitched cognac leather seat and grips, and rebuilt Boxer engine.",
      es: "BMW R100 Custom Roadster de Bandit Garage con depósito satinado fileteado en blanco y asiento en piel coñac con costura diamante.",
      fr: "BMW R100 Custom Roadster Bandit Garage avec réservoir satiné à filet blanc et selle en cuir cognac matelassé losange."
    },
    image: "bandit-models/bandit-custom-roadster.jpg",
    defaultColors: { tank: "nardo_grey", seat: "cognac_leather" }
  }
];

/**
 * OS 12 TÓPICOS DE PRODUTOS EXISTENTES E RESPETIVAS LISTAS DE ACESSÓRIOS
 * 1. Depósito | 2. Assento | 3. Bainhas Dianteiras / Suspensão | 4. Suspensão Traseira
 * 5. Jantes | 6. Pneus | 7. Guiador | 8. Piscas | 9. Travões | 10. Farol
 * 11. Visor de Conta-Quilómetros | 12. Punhos
 */
window.CONFIGURATOR_COMPONENTS = [
  {
    key: "tank",
    order: 1,
    title: { pt: "Depósito", en: "Fuel Tank", es: "Depósito", fr: "Réservoir" },
    description: {
      pt: "Escolha o depósito na lista de acessórios, a cor da pintura, o acabamento e as faixas",
      en: "Select the fuel tank from the accessories list, paint color, finish and stripes",
      es: "Elija el depósito en la lista de accesorios, color de pintura, acabado y franjas",
      fr: "Choisissez le réservoir dans la liste d'accessoires, la couleur, la finition et les filets"
    },
    accessoryLabel: { pt: "Acessório / Modelo de Depósito:", en: "Tank Accessory / Model:", es: "Accesorio / Modelo de Depósito:", fr: "Accessoire / Modèle de Réservoir :" },
    options: [
      { key: "bmw_monolever_custom", brand: "Original BMW / Bandit Custom", label: { pt: "Original BMW Monolever Decapado & Alinhado c/ Joelheiras", en: "Restored OEM BMW Monolever Tank w/ Knee Pads", es: "Original BMW Monolever Restaurado con Rodilleras", fr: "Original BMW Monolever Aligné avec Grippe-Genoux" } },
      { key: "bandit_alloy_monza", brand: "Bandit Handcrafted Alloy", label: { pt: "Bandit Handcrafted Alloy — Depósito em Alumínio c/ Tampão Monza", en: "Bandit Handcrafted Alloy Tank w/ Monza Cap", es: "Bandit Handcrafted Alloy — Depósito Aluminio con Tapón Monza", fr: "Bandit Handcrafted Alloy — Réservoir Aluminium avec Bouchon Monza" } },
      { key: "heinrich_hoske_endurance", brand: "Heinrich / Hoske", label: { pt: "Heinrich / Hoske — Depósito Competição Grande Capacidade", en: "Heinrich / Hoske Large Capacity Endurance Tank", es: "Heinrich / Hoske — Depósito Competición Gran Capacidad", fr: "Heinrich / Hoske — Réservoir Endurance Grande Capacité" } },
      { key: "wbo_custom_racing", brand: "WBO Custom", label: { pt: "WBO Custom — Depósito Estreito Café Racer c/ Recortes de Joelho", en: "WBO Custom Narrow Café Racer Tank w/ Knee Dents", es: "WBO Custom — Depósito Estrecho Café Racer", fr: "WBO Custom — Réservoir Étroit Café Racer" } }
    ],
    colors: [
      { key: "bandit_black", name: { pt: "Preto Ébano Bandit Profundo", en: "Bandit Deep Ebony Black", es: "Negro Ébano Bandit", fr: "Noir Ébène Bandit Profond" }, hex: "#111111" },
      { key: "british_green", name: { pt: "Verde British Racing / Oliva Mate", en: "British Racing / Olive Matte Green", es: "Verde British Racing / Oliva Mate", fr: "Vert British Racing / Olive Mat" }, hex: "#1b3b28" },
      { key: "midnight_blue", name: { pt: "Azul Meia-Noite Bandit", en: "Bandit Midnight Blue", es: "Azul Medianoche Bandit", fr: "Bleu Nuit Bandit" }, hex: "#172554" },
      { key: "nardo_grey", name: { pt: "Cinzento Nardo Acetinado", en: "Satin Nardo Grey", es: "Gris Nardo Satinado", fr: "Gris Nardo Satiné" }, hex: "#63696f" },
      { key: "desert_sand", name: { pt: "Areia Saara Dakar Mate", en: "Dakar Sahara Sand Matte", es: "Arena Sahara Dakar Mate", fr: "Sable Sahara Dakar Mat" }, hex: "#c4a376" },
      { key: "classic_silver", name: { pt: "Alumínio Escovado / Prata Motorsport", en: "Brushed Alloy / Motorsport Silver", es: "Aluminio Cepillado / Plata Motorsport", fr: "Aluminium Brossé / Argent Motorsport" }, hex: "#b5b7b9" }
    ],
    spec1Label: { pt: "Acabamento do Depósito:", en: "Tank Finish:", es: "Acabado del Depósito:", fr: "Finition du Réservoir :" },
    spec1Options: [
      { key: "matte_satin", name: { pt: "Mate Acetinado", en: "Satin Matte", es: "Mate Satinado", fr: "Mat Satiné" } },
      { key: "gloss_ceramic", name: { pt: "Brilhante Espelhado c/ Verniz Cerâmico", en: "Mirror Gloss w/ Ceramic Clearcoat", es: "Brillante con Barniz Cerámico", fr: "Brillant Miroir Vernis Céramique" } },
      { key: "raw_brushed", name: { pt: "Alumínio / Aço Escovado à Mão", en: "Hand-Brushed Raw Metal", es: "Metal Cepillado a Mano", fr: "Métal Brossé à la Main" } }
    ],
    spec2Label: { pt: "Tipo de Faixa / Filete:", en: "Stripes / Pinstriping:", es: "Tipo de Franja / Fileteado:", fr: "Type de Bande / Filet :" },
    spec2Options: [
      { key: "double_pinstripe", name: { pt: "Filete Duplo Clássico Pintado à Mão", en: "Classic Hand-Painted Twin Pinstripe", es: "Filete Doble Clásico a Mano", fr: "Double Filet Classique Peint à la Main" } },
      { key: "clean_pure", name: { pt: "Sem Faixas (Liso Puro)", en: "No Stripes (Pure Clean)", es: "Sin Franjas (Puro)", fr: "Sans Bandes (Pur)" } },
      { key: "motorsport_stripe", name: { pt: "Faixa Central Desportiva Bandit Motorsport", en: "Bandit Motorsport Center Racing Stripe", es: "Franja Central Bandit Motorsport", fr: "Bande Centrale Bandit Motorsport" } }
    ]
  },
  {
    key: "seat",
    order: 2,
    title: { pt: "Assento", en: "Seat & Saddle", es: "Asiento", fr: "Selle" },
    description: {
      pt: "Escolha o assento na lista de acessórios, o material/cor da pele e o padrão de costura",
      en: "Choose the seat from the accessories list, leather color/material and stitching pattern",
      es: "Elija el asiento en la lista de accesorios, piel y patrón de costura",
      fr: "Choisissez la selle dans la liste d'accessoires, le cuir et le motif de couture"
    },
    accessoryLabel: { pt: "Acessório / Formato do Assento:", en: "Seat Accessory / Format:", es: "Accesorio / Formato de Asiento:", fr: "Accessoire / Format de Selle :" },
    options: [
      { key: "cafe_solo_cowl", brand: "Bandit Leather Atelier", label: { pt: "Bandit Leather Atelier — Monolugar com Bossa Café Racer", en: "Bandit Leather Atelier — Solo Café Racer w/ Rear Cowl", es: "Bandit Leather Atelier — Monoplaza con Colín Café Racer", fr: "Bandit Leather Atelier — Monoplace avec Dosseret Café Racer" } },
      { key: "scrambler_bench", brand: "Bandit Leather Atelier", label: { pt: "Bandit Leather Atelier — Assento Corrido Biposto Scrambler", en: "Bandit Leather Atelier — Two-Up Scrambler Bench Seat", es: "Bandit Leather Atelier — Asiento Corrido Biplaza Scrambler", fr: "Bandit Leather Atelier — Selle Biplace Scrambler" } },
      { key: "motone_brat_flat", brand: "Motone Customs", label: { pt: "Motone Customs — Brat Style Plano Encurtado", en: "Motone Customs — Shortened Flat Brat Style Bench", es: "Motone Customs — Brat Style Plano Recortado", fr: "Motone Customs — Selle Plate Courte Brat Style" } },
      { key: "spirit_bobber_solo", brand: "Spirit Leather", label: { pt: "Spirit Leather — Selim Solo Cantilever Flutuante Bobber", en: "Spirit Leather — Floating Cantilever Bobber Solo Saddle", es: "Spirit Leather — Sillín Solo Flotante Cantilever Bobber", fr: "Spirit Leather — Selle Solo Suspendue Cantilever Bobber" } },
      { key: "wilder_tracker_slim", brand: "Wilder Factory", label: { pt: "Wilder Factory — Assento Slim Street Tracker Competição", en: "Wilder Factory — Slim Street Tracker Competition Seat", es: "Wilder Factory — Asiento Slim Street Tracker", fr: "Wilder Factory — Selle Fine Street Tracker" } }
    ],
    materials: [
      { key: "cognac_leather", name: { pt: "Pele Natural Anilina Castanho Conhaque", en: "Cognac Brown Aniline Natural Leather", es: "Piel Natural Anilina Marrón Coñac", fr: "Cuir Naturel Aniline Marron Cognac" } },
      { key: "chocolate_leather", name: { pt: "Couro Rústico Castanho Chocolate Vintage", en: "Vintage Chocolate Brown Rustic Hide", es: "Cuero Rústico Marrón Chocolate Vintage", fr: "Cuir Rustique Marron Chocolat Vintage" } },
      { key: "black_nautical", name: { pt: "Pele Preta Náutica Impermeabilizada", en: "Waterproof Matte Black Nautical Leather", es: "Piel Negra Náutica Impermeable", fr: "Cuir Noir Nautique Imperméabilisé" } },
      { key: "alcantara_suede", name: { pt: "Camurça Alcantara Antracite Hidrófuga", en: "Hydrophobic Anthracite Alcantara Suede", es: "Alcantara Antracita Hidrófuga", fr: "Alcantara Anthracite Imperméabilisé" } },
      { key: "crimson_red", name: { pt: "Pele Artesanal Vermelho Carmim Tracker", en: "Handcrafted Crimson Red Tracker Leather", es: "Piel Artesanal Rojo Carmín Tracker", fr: "Cuir Artisanal Rouge Carmin Tracker" } }
    ],
    stitches: [
      { key: "diamond", name: { pt: "Costura em Diamante (Diamond Stitch)", en: "Diamond Quilted Stitch", es: "Costura en Diamante", fr: "Matelassage Losange (Diamond)" } },
      { key: "tuck_roll", name: { pt: "Costura Canelada Transversal (Tuck & Roll)", en: "Transverse Ribbed Tuck & Roll", es: "Canelado Transversal (Tuck & Roll)", fr: "Côtelé Transversal (Tuck & Roll)" } },
      { key: "plain_french", name: { pt: "Costura Lisa Clássica c/ Pesponto Duplo", en: "Smooth Classic w/ French Double Seam", es: "Costura Lisa con Pespunte Doble", fr: "Couture Lisse Classique Double Piqûre" } }
    ]
  },
  {
    key: "frontSuspension",
    order: 3,
    title: { pt: "Bainhas Dianteiras / Suspensão", en: "Front Forks & Suspension", es: "Horquilla & Suspensión Delantera", fr: "Fourche & Suspension Avant" },
    description: {
      pt: "Escolha a suspensão dianteira na lista de acessórios, o curso e o acabamento das bainhas",
      en: "Select the front suspension from the accessories list, travel setup and stanchion finish",
      es: "Seleccione la suspensión delantera en la lista de accesorios, recorrido y acabado",
      fr: "Sélectionnez la suspension avant dans la liste d'accessoires, le débattement et la finition"
    },
    accessoryLabel: { pt: "Acessório / Suspensão Dianteira:", en: "Front Suspension Accessory:", es: "Accesorio de Suspensión Delantera:", fr: "Accessoire Suspension Avant :" },
    options: [
      { key: "ohlins_usd_fg", brand: "Öhlins", label: { pt: "Öhlins — Forqueta Invertida USD Racing c/ Mesas Maquinadas CNC", en: "Öhlins — Inverted USD Racing Forks w/ Billet CNC Triple Trees", es: "Öhlins — Horquilla Invertida USD Racing con Tijas CNC", fr: "Öhlins — Fourche Inversée USD Racing avec Tés Usinés CNC" } },
      { key: "marzocchi_usd_50", brand: "Marzocchi", label: { pt: "Marzocchi — Suspensão Invertida USD 50mm Duplo Disco", en: "Marzocchi — 50mm Inverted USD Dual-Disc Forks", es: "Marzocchi — Horquilla Invertida USD 50mm Doble Disco", fr: "Marzocchi — Fourche Inversée USD 50mm Double Disque" } },
      { key: "showa_usd_sport", brand: "Showa", label: { pt: "Showa — Forqueta Invertida Desportiva Regulável em Pré-Carga e Retorno", en: "Showa — Fully Adjustable Sport Inverted USD Forks", es: "Showa — Horquilla Invertida Deportiva Regulable", fr: "Showa — Fourche Inversée Sport Entièrement Réglable" } },
      { key: "wp_rally_long", brand: "WP Suspension", label: { pt: "WP Suspension — Forqueta Todo-o-Terreno Scrambler / Rally Raid", en: "WP Suspension — All-Terrain Scrambler / Rally Raid Forks", es: "WP Suspension — Horquilla Todo Terreno Scrambler / Rally", fr: "WP Suspension — Fourche Tout-Terrain Scrambler / Rally" } },
      { key: "bmw_oem_gaiters", brand: "Original BMW Revista", label: { pt: "Original BMW Revista — Telescópica c/ Molas Progressivas & Foles Clássicos", en: "Rebuilt OEM BMW Telescopic w/ Progressive Springs & Gaiters", es: "Original BMW Revisada con Muelles Progresivos y Fuelles", fr: "Origine BMW Révisée avec Ressorts Progressifs & Soufflets" } }
    ],
    spec1Label: { pt: "Curso / Afinação:", en: "Travel / Setup:", es: "Recorrido / Ajuste:", fr: "Débattement / Réglage :" },
    spec1Options: [
      { key: "standard_road", name: { pt: "Curso Standard Estrada", en: "Standard Road Travel", es: "Recorrido Estándar Carretera", fr: "Débattement Standard Route" } },
      { key: "scrambler_plus30", name: { pt: "Curso Elevado Scrambler (+30mm)", en: "Extended Scrambler Travel (+30mm)", es: "Recorrido Elevado Scrambler (+30mm)", fr: "Débattement Relevé Scrambler (+30mm)" } },
      { key: "cafe_lowered25", name: { pt: "Rebaixada Café Racer (-25mm)", en: "Lowered Café Racer Stance (-25mm)", es: "Rebajada Café Racer (-25mm)", fr: "Surbaissée Café Racer (-25mm)" } }
    ],
    spec2Label: { pt: "Acabamento / Cor das Bainhas:", en: "Stanchion Finish / Color:", es: "Acabado / Color de Botellas:", fr: "Finition / Couleur des Fourreaux :" },
    spec2Options: [
      { key: "gold_racing", name: { pt: "Anodizado Dourado Racing", en: "Anodized Racing Gold", es: "Anodizado Dorado Racing", fr: "Anodisé Or Racing" } },
      { key: "matte_black", name: { pt: "Anodizado Preto Fosco", en: "Matte Black Anodized", es: "Anodizado Negro Mate", fr: "Anodisé Noir Mat" } },
      { key: "polished_alloy", name: { pt: "Alumínio Polido Espelho", en: "Mirror Polished Alloy", es: "Aluminio Pulido Espejo", fr: "Aluminium Poli Miroir" } }
    ]
  },
  {
    key: "rearSuspension",
    order: 4,
    title: { pt: "Suspensão Traseira", en: "Rear Suspension", es: "Suspensión Trasera", fr: "Suspension Arrière" },
    description: {
      pt: "Escolha os amortecedores traseiros na lista de acessórios, a configuração e o acabamento",
      en: "Select the rear shocks from the accessories list, configuration and finish",
      es: "Seleccione los amortiguadores traseros en la lista de accesorios, configuración y acabado",
      fr: "Sélectionnez les amortisseurs arrière dans la liste d'accessoires, la configuration et la finition"
    },
    accessoryLabel: { pt: "Acessório / Amortecedor Traseiro:", en: "Rear Shock Accessory:", es: "Accesorio Amortiguador Trasero:", fr: "Accessoire Amortisseur Arrière :" },
    options: [
      { key: "ohlins_stx36_blackline", brand: "Öhlins", label: { pt: "Öhlins — STX 36 Blackline Twin Shock / Monoshock a Gás", en: "Öhlins — STX 36 Blackline Gas Shocks", es: "Öhlins — STX 36 Blackline Amortiguadores de Gas", fr: "Öhlins — Amortisseurs Gaz STX 36 Blackline" } },
      { key: "ohlins_piggyback_gold", brand: "Öhlins", label: { pt: "Öhlins — S36PR1C1L c/ Reservatório Separado Piggyback", en: "Öhlins — S36PR1C1L w/ External Piggyback Reservoir", es: "Öhlins — Con Depósito Separado Piggyback", fr: "Öhlins — Avec Réservoir Séparé Piggyback" } },
      { key: "yss_rz362_black", brand: "YSS Suspension", label: { pt: "YSS Suspension — RZ362 Custom Black Totalmente Regulável", en: "YSS Suspension — RZ362 Fully Adjustable Custom Black", es: "YSS Suspension — RZ362 Custom Black Regulable", fr: "YSS Suspension — RZ362 Custom Black Réglable" } },
      { key: "hagon_cantilever", brand: "Hagon Shocks", label: { pt: "Hagon Shocks — Conversão Monoshock Central Cantilever Sob o Banco", en: "Hagon Shocks — Under-Seat Cantilever Monoshock Conversion", es: "Hagon Shocks — Conversión Monoamortiguador Cantilever", fr: "Hagon Shocks — Conversion Monoshock Cantilever Central" } },
      { key: "bitubo_ktech_razor", brand: "Bitubo / K-Tech", label: { pt: "K-Tech Razor-R / Bitubo — Amortecedor Desportivo de Competição", en: "K-Tech Razor-R / Bitubo — Competition Rear Shock", es: "K-Tech Razor-R / Bitubo — Amortiguador Deportivo", fr: "K-Tech Razor-R / Bitubo — Amortisseur Sport Compétition" } }
    ],
    spec1Label: { pt: "Configuração Traseira:", en: "Rear Configuration:", es: "Configuración Trasera:", fr: "Configuration Arrière :" },
    spec1Options: [
      { key: "twin_shock", name: { pt: "Duplo Amortecedor Clássico (Twin Shock)", en: "Classic Twin Shock", es: "Doble Amortiguador Clásico", fr: "Double Amortisseur Classique" } },
      { key: "monoshock_cantilever", name: { pt: "Monoshock Cantilever Central", en: "Central Cantilever Monoshock", es: "Monoshock Cantilever Central", fr: "Monoshock Cantilever Central" } },
      { key: "piggyback_reservoir", name: { pt: "Com Reservatório Separado (Piggyback)", en: "With Piggyback Reservoir", es: "Con Depósito Piggyback", fr: "Avec Réservoir Piggyback" } }
    ],
    spec2Label: { pt: "Cor da Mola / Acabamento:", en: "Spring Color / Finish:", es: "Color del Muelle / Acabado:", fr: "Couleur du Ressort / Finition :" },
    spec2Options: [
      { key: "black_alu", name: { pt: "Mola Preta / Corpo Alumínio", en: "Black Spring / Alloy Body", es: "Muelle Negro / Cuerpo Aluminio", fr: "Ressort Noir / Corps Aluminium" } },
      { key: "ohlins_yellow", name: { pt: "Mola Amarela Öhlins / Dourado", en: "Öhlins Yellow Spring / Gold", es: "Muelle Amarillo Öhlins", fr: "Ressort Jaune Öhlins" } },
      { key: "total_black", name: { pt: "Total Black Fosco Stealth", en: "Full Matte Black Stealth", es: "Total Black Mate", fr: "Total Black Mat" } }
    ]
  },
  {
    key: "wheels",
    order: 5,
    title: { pt: "Jantes", en: "Wheels & Rims", es: "Llantas", fr: "Jantes" },
    description: {
      pt: "Escolha as jantes na lista de acessórios, o diâmetro e o acabamento dos aros e raios",
      en: "Choose the wheels from the accessories list, rim diameter and spoke finish",
      es: "Elija las llantas en la lista de accesorios, diámetro y acabado de aros y radios",
      fr: "Choisissez les jantes dans la liste d'accessoires, le diamètre et la finition des rayons"
    },
    accessoryLabel: { pt: "Acessório / Modelo de Jante:", en: "Wheel / Rim Accessory:", es: "Accesorio / Modelo de Llanta:", fr: "Accessoire / Modèle de Jante :" },
    options: [
      { key: "excel_takasago_spoked", brand: "Excel Takasago", label: { pt: "Excel Takasago — Jantes Raiadas c/ Aros em Alumínio & Raios Inox", en: "Excel Takasago — Spoked Alloy Rims w/ Stainless Spokes", es: "Excel Takasago — Llantas de Radios con Aros de Aluminio", fr: "Excel Takasago — Jantes à Rayons Inox et Cerclages Alu" } },
      { key: "kineo_tubeless_billet", brand: "Kineo Tubeless", label: { pt: "Kineo Tubeless — Jantes Raiadas Sem Câmara c/ Cubos Billet CNC", en: "Kineo Tubeless — Spoked Tubeless Wheels w/ CNC Billet Hubs", es: "Kineo Tubeless — Llantas de Radios Sin Cámara con Bujes CNC", fr: "Kineo Tubeless — Jantes à Rayons Tubeless Moyeux CNC" } },
      { key: "borrani_classic_record", brand: "Borrani", label: { pt: "Borrani M-Ray — Jantes Clássicas Italianas em Alumínio Polido", en: "Borrani M-Ray — Classic Italian Polished Alloy Spoked Wheels", es: "Borrani M-Ray — Llantas Clásicas de Aluminio Pulido", fr: "Borrani M-Ray — Jantes Classiques Italiennes Alu Poli" } },
      { key: "sanremo_enduro_pro", brand: "Sanremo", label: { pt: "Sanremo — Aros Reforçados Todo-o-Terreno Scrambler", en: "Sanremo — Heavy-Duty Scrambler Spoked Rims", es: "Sanremo — Aros Reforzados Scrambler", fr: "Sanremo — Cerclages Renforcés Scrambler" } },
      { key: "bmw_snowflake_alloy", brand: "Original BMW Snowflake", label: { pt: "Original BMW Snowflake — Liga Leve Restaurada a Preto ou Bicolor", en: "Restored OEM BMW Snowflake Cast Alloy Wheels", es: "Original BMW Snowflake — Aleación Restaurada", fr: "Origine BMW Snowflake — Jantes Alliage Restaurées" } }
    ],
    spec1Label: { pt: "Diâmetro Dianteira / Traseira:", en: "Front / Rear Diameter:", es: "Diámetro Delantera / Trasera:", fr: "Diamètre Avant / Arrière :" },
    spec1Options: [
      { key: "19_18_classic", name: { pt: "Dianteira 19\" / Traseira 18\"", en: "Front 19\" / Rear 18\"", es: "Delantera 19\" / Trasera 18\"", fr: "Avant 19\" / Arrière 18\"" } },
      { key: "18_18_cafe", name: { pt: "Dianteira 18\" / Traseira 18\"", en: "Front 18\" / Rear 18\"", es: "Delantera 18\" / Trasera 18\"", fr: "Avant 18\" / Arrière 18\"" } },
      { key: "17_17_sport", name: { pt: "Dianteira 17\" / Traseira 17\" Desportiva", en: "Front 17\" / Rear 17\" Sport", es: "Delantera 17\" / Trasera 17\"", fr: "Avant 17\" / Arrière 17\"" } }
    ],
    spec2Label: { pt: "Acabamento dos Aros & Cubos:", en: "Rim & Hub Finish:", es: "Acabado de Aros y Bujes:", fr: "Finition Cerclages & Moyeux :" },
    spec2Options: [
      { key: "black_stainless", name: { pt: "Aros Pretos Acetinados c/ Raios Inox", en: "Satin Black Rims w/ Stainless Spokes", es: "Aros Negros con Radios Inox", fr: "Cerclages Noirs & Rayons Inox" } },
      { key: "total_black_satin", name: { pt: "Total Black Satin (Aros, Raios e Cubos Pretos)", en: "Full Satin Black (Rims, Spokes & Hubs)", es: "Total Black Satin", fr: "Total Black Satiné" } },
      { key: "polished_classic", name: { pt: "Aros em Alumínio Polido Clássico", en: "Classic Mirror-Polished Alloy Rims", es: "Aros de Aluminio Pulido", fr: "Cerclages Aluminium Poli" } }
    ]
  },
  {
    key: "tires",
    order: 6,
    title: { pt: "Pneus", en: "Tyres", es: "Neumáticos", fr: "Pneus" },
    description: {
      pt: "Escolha os pneus na lista de acessórios e a medida dianteira/traseira",
      en: "Select the tyres from the accessories list and front/rear sizing",
      es: "Seleccione los neumáticos en la lista de accesorios y la medida",
      fr: "Sélectionnez les pneus dans la liste d'accessoires et les dimensions"
    },
    accessoryLabel: { pt: "Acessório / Marca e Modelo de Pneu:", en: "Tyre Brand & Model:", es: "Marca y Modelo de Neumático:", fr: "Marque et Modèle de Pneu :" },
    options: [
      { key: "continental_tkc80", brand: "Continental", label: { pt: "Continental TKC 80 Twinduro — Piso Misto de Tacos (Scrambler / Rally)", en: "Continental TKC 80 Twinduro — Knobby Dual-Sport (Scrambler / Rally)", es: "Continental TKC 80 Twinduro — Tacos Mixto (Scrambler / Rally)", fr: "Continental TKC 80 Twinduro — Crampons Mixtes (Scrambler / Rally)" } },
      { key: "pirelli_mt60_rs", brand: "Pirelli", label: { pt: "Pirelli MT60 RS — Street Tracker & Scrambler Desportivo", en: "Pirelli MT60 RS — Street Tracker & Sport Scrambler", es: "Pirelli MT60 RS — Street Tracker & Scrambler", fr: "Pirelli MT60 RS — Street Tracker & Scrambler" } },
      { key: "firestone_deluxe", brand: "Firestone", label: { pt: "Firestone Deluxe Champion — Clássico Vintage Canelado (Brat / Bobber)", en: "Firestone Deluxe Champion — Vintage Sawtooth (Brat / Bobber)", es: "Firestone Deluxe Champion — Clásico Vintage (Brat / Bobber)", fr: "Firestone Deluxe Champion — Rétro Cannelé (Brat / Bobber)" } },
      { key: "heidenau_k60_ranger", brand: "Heidenau", label: { pt: "Heidenau K60 Scout / Ranger — Todo-o-Terreno de Longa Distância", en: "Heidenau K60 Scout / Ranger — Long-Distance Adventure", es: "Heidenau K60 Scout / Ranger — Todo Terreno", fr: "Heidenau K60 Scout / Ranger — Tout-Terrain" } },
      { key: "avon_roadrider_mk2", brand: "Avon", label: { pt: "Avon Roadrider MKII — Desportivo de Estrada Clássico (Café Racer)", en: "Avon Roadrider MKII — Classic Sport Road (Café Racer)", es: "Avon Roadrider MKII — Deportivo de Carretera (Café Racer)", fr: "Avon Roadrider MKII — Sport Route Classique (Café Racer)" } }
    ],
    spec1Label: { pt: "Medida Dianteira / Traseira:", en: "Front / Rear Size:", es: "Medida Delantera / Trasera:", fr: "Dimensions Avant / Arrière :" },
    spec1Options: [
      { key: "110_140", name: { pt: "110/80-19 & 140/80-17", en: "110/80-19 & 140/80-17", es: "110/80-19 & 140/80-17", fr: "110/80-19 & 140/80-17" } },
      { key: "100_130", name: { pt: "100/90-19 & 130/80-18", en: "100/90-19 & 130/80-18", es: "100/90-19 & 130/80-18", fr: "100/90-19 & 130/80-18" } },
      { key: "400_450_vintage", name: { pt: "4.00-19 & 4.50-18 Perfil Alto Vintage", en: "4.00-19 & 4.50-18 Tall Vintage Profile", es: "4.00-19 & 4.50-18 Perfil Alto Vintage", fr: "4.00-19 & 4.50-18 Profil Haut Vintage" } }
    ]
  },
  {
    key: "handlebar",
    order: 7,
    title: { pt: "Guiador", en: "Handlebar", es: "Manillar", fr: "Guidon" },
    description: {
      pt: "Escolha o guiador ou avanços clip-on na lista de acessórios, diâmetro e acabamento",
      en: "Select the handlebar or clip-ons from the accessories list, diameter and finish",
      es: "Seleccione el manillar o semimanillares en la lista de accesorios, diámetro y acabado",
      fr: "Sélectionnez le guidon ou les bracelets dans la liste d'accessoires, le diamètre et la finition"
    },
    accessoryLabel: { pt: "Acessório / Modelo de Guiador:", en: "Handlebar Accessory / Model:", es: "Accesorio / Modelo de Manillar:", fr: "Accessoire / Modèle de Guidon :" },
    options: [
      { key: "lsl_clipons_cnc", brand: "LSL Motorrad", label: { pt: "LSL Motorrad — Avanços Clip-On de Forqueta Maquinados CNC (Café Racer)", en: "LSL Motorrad — CNC Billet Fork Clip-Ons (Café Racer)", es: "LSL Motorrad — Semimanillares Clip-On CNC (Café Racer)", fr: "LSL Motorrad — Guidons Bracelets Clip-On CNC (Café Racer)" } },
      { key: "renthal_fatbar_scrambler", brand: "Renthal Fatbar", label: { pt: "Renthal Fatbar 28.6mm — Guiador Largo Scrambler c/ Barra de Reforço", en: "Renthal Fatbar 28.6mm — Wide Scrambler Bar w/ Crossbrace", es: "Renthal Fatbar 28.6mm — Manillar Ancho Scrambler", fr: "Renthal Fatbar 28.6mm — Guidon Large Scrambler" } },
      { key: "biltwell_tracker_mid", brand: "Biltwell", label: { pt: "Biltwell Moto Bar / Tracker — Guiador Médio Urbano Confortável", en: "Biltwell Moto Bar / Tracker — Mid-Rise Urban Bar", es: "Biltwell Moto Bar / Tracker — Manillar Medio Urbano", fr: "Biltwell Moto Bar / Tracker — Guidon Moyen Urbain" } },
      { key: "tommaselli_condor", brand: "Tommaselli", label: { pt: "Tommaselli — Semiguidões Clássicos de Competição Reguláveis", en: "Tommaselli — Classic Adjustable Racing Clip-Ons", es: "Tommaselli — Semimanillares Clásicos Regulables", fr: "Tommaselli — Bracelets Classiques de Compétition" } },
      { key: "gilles_tooling_gp", brand: "Gilles Tooling", label: { pt: "Gilles Tooling GP — Avanços Desportivos Ultra-Leves", en: "Gilles Tooling GP — Ultra-Light Sport Clip-Ons", es: "Gilles Tooling GP — Semimanillares Ultraligeros", fr: "Gilles Tooling GP — Bracelets Sport Ultra-Légers" } }
    ],
    spec1Label: { pt: "Acabamento / Cor:", en: "Finish / Color:", es: "Acabado / Color:", fr: "Finition / Couleur :" },
    spec1Options: [
      { key: "black_anodized", name: { pt: "Preto Anodizado Fosco", en: "Matte Black Anodized", es: "Negro Anodizado Mate", fr: "Noir Anodisé Mat" } },
      { key: "brushed_alu", name: { pt: "Alumínio Escovado Acetinado", en: "Satin Brushed Alloy", es: "Aluminio Cepillado", fr: "Aluminium Brossé" } },
      { key: "chrome_mirror", name: { pt: "Cromado Clássico Espelho", en: "Classic Mirror Chrome", es: "Cromado Espejo", fr: "Chromé Miroir" } }
    ]
  },
  {
    key: "turnSignals",
    order: 8,
    title: { pt: "Piscas", en: "Turn Signals & Mirrors", es: "Intermitentes", fr: "Clignotants" },
    description: {
      pt: "Escolha os piscas na lista de acessórios, localização e tecnologia LED",
      en: "Select the turn signals from the accessories list, mounting location and LED technology",
      es: "Seleccione los intermitentes en la lista de accesorios, ubicación y tecnología LED",
      fr: "Sélectionnez les clignotants dans la liste d'accessoires, l'emplacement et la technologie LED"
    },
    accessoryLabel: { pt: "Acessório / Modelo de Piscas:", en: "Turn Signals Accessory:", es: "Accesorio / Modelo de Intermitentes:", fr: "Accessoire / Modèle de Clignotants :" },
    options: [
      { key: "motogadget_moblaze_disc", brand: "Motogadget", label: { pt: "Motogadget mo.blaze disc — Piscas LED nos Topos do Guiador (Bar-End)", en: "Motogadget mo.blaze disc — Bar-End LED Turn Signals", es: "Motogadget mo.blaze disc — Intermitentes LED en Extremos de Manillar", fr: "Motogadget mo.blaze disc — Clignotants LED Embout de Guidon" } },
      { key: "kellermann_atto_3in1", brand: "Kellermann", label: { pt: "Kellermann Atto DF — Micro LED 3-em-1 (Stop, Posição e Pisca)", en: "Kellermann Atto DF — Ultra-Mini 3-in-1 LED Signals", es: "Kellermann Atto DF — Micro LED 3 en 1", fr: "Kellermann Atto DF — Micro LED 3-en-1" } },
      { key: "highsider_apollo_bullet", brand: "Highsider", label: { pt: "Highsider Apollo Bullet — Alumínio Preto c/ Lente Fumada", en: "Highsider Apollo Bullet — Black Alloy w/ Smoked Lens", es: "Highsider Apollo Bullet — Aluminio Negro con Lente Ahumada", fr: "Highsider Apollo Bullet — Aluminium Noir Verre Fumé" } },
      { key: "bandit_loop_integrated", brand: "Bandit Custom", label: { pt: "Bandit Subframe Loop — Fita LED Integrada no Loop Traseiro + Micro Frontais", en: "Bandit Subframe Loop — Integrated Rear Loop LED Strip + Micro Fronts", es: "Bandit Loop — Tira LED Integrada en Chasis Trasero", fr: "Bandit Loop — Bandeau LED Intégré à la Boucle Arrière" } }
    ],
    spec1Label: { pt: "Acabamento:", en: "Finish:", es: "Acabado:", fr: "Finition :" },
    spec1Options: [
      { key: "black_anodized", name: { pt: "Alumínio Preto Anodizado", en: "Black Anodized Alloy", es: "Aluminio Negro Anodizado", fr: "Aluminium Noir Anodisé" } },
      { key: "chrome_polished", name: { pt: "Alumínio Cromado Polido", en: "Polished Chrome Alloy", es: "Aluminio Cromado", fr: "Aluminium Chromé" } }
    ]
  },
  {
    key: "brakes",
    order: 9,
    title: { pt: "Travões", en: "Brakes", es: "Frenos", fr: "Freins" },
    description: {
      pt: "Escolha o sistema de travagem na lista de acessórios, tubagens e cor das pinças",
      en: "Select the braking system from the accessories list, brake lines and caliper finish",
      es: "Seleccione el sistema de frenos en la lista de accesorios, latiguillos y color de pinzas",
      fr: "Sélectionnez le système de freinage dans la liste d'accessoires, durites et couleur des étriers"
    },
    accessoryLabel: { pt: "Acessório / Sistema de Travagem:", en: "Braking System Accessory:", es: "Accesorio / Sistema de Frenos:", fr: "Accessoire / Système de Freinage :" },
    options: [
      { key: "brembo_m4_radial", brand: "Brembo", label: { pt: "Brembo M4 Monobloc — Pinças Radiais 4-Pistões c/ Duplo Disco Flutuante 320mm", en: "Brembo M4 Monobloc — Radial 4-Piston Calipers w/ Dual 320mm Floating Rotors", es: "Brembo M4 Monobloc — Pinzas Radiales 4 Pistones y Doble Disco 320mm", fr: "Brembo M4 Monobloc — Étriers Radiaux 4 Pistons & Double Disque 320mm" } },
      { key: "brembo_oro_rcs19", brand: "Brembo", label: { pt: "Brembo Série Oro + Bomba Principal Radial Brembo RCS19", en: "Brembo Serie Oro Calipers + Brembo RCS19 Radial Master Cylinder", es: "Brembo Serie Oro + Bomba Radial Brembo RCS19", fr: "Brembo Série Oro + Maître-Cylindre Radial Brembo RCS19" } },
      { key: "beringer_aerotec_cnc", brand: "Beringer Brakes", label: { pt: "Beringer Brakes Aerotec — Pinças Maquinadas CNC de Alta Performance", en: "Beringer Brakes Aerotec — Billet CNC High-Performance Calipers", es: "Beringer Brakes Aerotec — Pinzas Mecanizadas CNC", fr: "Beringer Brakes Aerotec — Étriers Taillés Masse CNC" } },
      { key: "hel_braided_oem", brand: "Hel Performance / Nissin", label: { pt: "Pinças Clássicas Retificadas c/ Tubagens em Malha de Aço Hel Performance", en: "Rebuilt Classic Calipers w/ Hel Performance Braided Stainless Lines", es: "Pinzas Clásicas con Latiguillos Metálicos Hel Performance", fr: "Étriers Classiques Révisés avec Durites Aviation Hel Performance" } }
    ],
    spec1Label: { pt: "Cor / Acabamento das Pinças:", en: "Caliper Color / Finish:", es: "Color / Acabado de Pinzas:", fr: "Couleur / Finition des Étriers :" },
    spec1Options: [
      { key: "black_red_logo", name: { pt: "Pinças Pretas c/ Letras Vermelhas", en: "Black Calipers w/ Red Lettering", es: "Pinzas Negras con Letras Rojas", fr: "Étriers Noirs Lettrage Rouge" } },
      { key: "gold_anodized", name: { pt: "Pinças Douradas Anodizadas Racing", en: "Anodized Racing Gold Calipers", es: "Pinzas Doradas Anodizadas", fr: "Étriers Or Anodisé Racing" } },
      { key: "titanium_raw", name: { pt: "Alumínio / Titânio Maquinado", en: "Machined Titanium / Alloy", es: "Aluminio / Titanio Mecanizado", fr: "Aluminium / Titane Usiné" } }
    ]
  },
  {
    key: "headlight",
    order: 10,
    title: { pt: "Farol", en: "Headlight", es: "Faro", fr: "Phare" },
    description: {
      pt: "Escolha o farol dianteiro na lista de acessórios, tamanho da óptica e acabamento",
      en: "Select the front headlight from the accessories list, lens size and housing finish",
      es: "Seleccione el faro delantero en la lista de accesorios, tamaño de óptica y acabado",
      fr: "Sélectionnez le phare avant dans la liste d'accessoires, le diamètre et la finition"
    },
    accessoryLabel: { pt: "Acessório / Modelo de Farol:", en: "Headlight Accessory / Model:", es: "Accesorio / Modelo de Faro:", fr: "Accessoire / Modèle de Phare :" },
    options: [
      { key: "koso_thunderbolt_led", brand: "Koso", label: { pt: "Koso Thunderbolt 7\" — Projector LED de Alta Potência c/ Anel DRL Halo", en: "Koso Thunderbolt 7\" — High-Output LED Projector w/ Halo DRL", es: "Koso Thunderbolt 7\" — Proyector LED con Anillo DRL", fr: "Koso Thunderbolt 7\" — Projecteur LED avec Anneau DRL" } },
      { key: "jwspeaker_adaptive", brand: "JW Speaker", label: { pt: "JW Speaker 8790 Adaptive — Farol LED Direcional em Curva", en: "JW Speaker 8790 Adaptive — Cornering LED Headlight", es: "JW Speaker 8790 Adaptive — Faro LED Direccional", fr: "JW Speaker 8790 Adaptive — Phare LED Directionnel" } },
      { key: "bates_vintage_yellow", brand: "Bates Style", label: { pt: "Bates Style 5 3/4\" — Vidro Amarelo Vintage c/ Grelha Protetora", en: "Bates Style 5 3/4\" — Vintage Yellow Lens w/ Stone Guard", es: "Bates Style 5 3/4\" — Cristal Amarillo Vintage con Rejilla", fr: "Bates Style 5 3/4\" — Verre Jaune Vintage avec Grille" } },
      { key: "denali_rally_twin", brand: "Denali Electronics", label: { pt: "Denali D7 / Rally Raid — Óptica de Alta Intensidade Todo-o-Terreno", en: "Denali D7 / Rally Raid — High-Intensity Off-Road Optics", es: "Denali D7 / Rally Raid — Óptica Todo Terreno", fr: "Denali D7 / Rally Raid — Optique Haute Intensité Tout-Terrain" } },
      { key: "highsider_reno_bikini", brand: "Highsider", label: { pt: "Highsider Reno LED — Integrado em Carenagem Bikini Café Racer", en: "Highsider Reno LED — Integrated in Café Racer Bikini Fairing", es: "Highsider Reno LED — Con Carenado Bikini Café Racer", fr: "Highsider Reno LED — Avec Carénage Bikini Café Racer" } }
    ],
    spec1Label: { pt: "Acabamento da Carcaça / Aro:", en: "Housing & Bezel Finish:", es: "Acabado de Carcasa y Aro:", fr: "Finition du Cuvelage & Cerclage :" },
    spec1Options: [
      { key: "matte_black_alu", name: { pt: "Aro Preto Mate c/ Carcaça Alumínio", en: "Matte Black Bezel w/ Alloy Bucket", es: "Aro Negro Mate con Carcasa Aluminio", fr: "Cerclage Noir Mat & Boîtier Alu" } },
      { key: "total_black_gloss", name: { pt: "Total Black c/ Grelha Protetora", en: "Full Black w/ Protective Grill", es: "Total Black con Rejilla Protectora", fr: "Total Black avec Grille de Protection" } },
      { key: "chrome_classic", name: { pt: "Aro Cromado Clássico", en: "Classic Chrome Bezel", es: "Aro Cromado Clásico", fr: "Cerclage Chromé Classique" } }
    ]
  },
  {
    key: "speedometer",
    order: 11,
    title: { pt: "Visor de Conta-Quilómetros", en: "Speedometer & Instrument Cluster", es: "Velocímetro & Cuadro", fr: "Compteur & Instrumentation" },
    description: {
      pt: "Escolha o visor de conta-quilómetros na lista de acessórios e o tipo de montagem",
      en: "Select the speedometer from the accessories list and mounting configuration",
      es: "Seleccione el velocímetro en la lista de accesorios y el tipo de montaje",
      fr: "Sélectionnez le compteur dans la liste d'accessoires et le type de montage"
    },
    accessoryLabel: { pt: "Acessório / Visor Conta-Quilómetros:", en: "Speedometer Accessory:", es: "Accesorio / Velocímetro:", fr: "Accessoire / Compteur :" },
    options: [
      { key: "motogadget_tiny_49", brand: "Motogadget", label: { pt: "Motogadget motoscope tiny — Mini Visor 49mm Embutido na Mesa Superior", en: "Motogadget motoscope tiny — 49mm Gauge Flush-Mounted in Top Triple Tree", es: "Motogadget motoscope tiny — Mini Reloj 49mm Encastrado en Tija", fr: "Motogadget motoscope tiny — Mini Compteur 49mm Encastré dans le Té" } },
      { key: "motogadget_chronoclassic", brand: "Motogadget", label: { pt: "Motogadget Chronoclassic — Conta-Rotações Analógico + Display LCD Dark", en: "Motogadget Chronoclassic — Analog Tachometer + Dark LCD Display", es: "Motogadget Chronoclassic — Analógico + Pantalla LCD Dark", fr: "Motogadget Chronoclassic — Analogique + Écran LCD Dark" } },
      { key: "daytona_velona_80", brand: "Daytona", label: { pt: "Daytona Velona 80mm — Velocímetro & Conta-Rotações Digital/Analógico", en: "Daytona Velona 80mm — Digital/Analog Speedo & Tach", es: "Daytona Velona 80mm — Velocímetro y Tacómetro", fr: "Daytona Velona 80mm — Compteur & Compte-Tours" } },
      { key: "koso_tnt_multifunc", brand: "Koso", label: { pt: "Koso TNT-B — Mostrador Multifunções Preto Anodizado", en: "Koso TNT-B — Black Anodized Multi-Function Gauge", es: "Koso TNT-B — Reloj Multifunción Negro Anodizado", fr: "Koso TNT-B — Compteur Multifonctions Noir Anodisé" } },
      { key: "acewell_classic_cnc", brand: "Acewell", label: { pt: "Acewell Classic — Manómetro Clássico c/ Suporte Maquinado CNC", en: "Acewell Classic — Classic Gauge w/ CNC Billet Bracket", es: "Acewell Classic — Reloj Clásico con Soporte CNC", fr: "Acewell Classic — Compteur Classique avec Support CNC" } }
    ],
    spec1Label: { pt: "Tipo de Montagem:", en: "Mounting Style:", es: "Tipo de Montaje:", fr: "Type de Montage :" },
    spec1Options: [
      { key: "flush_triple_tree", name: { pt: "Embutido na Mesa de Direção Usinada à Medida", en: "Flush-Mounted in Custom CNC Triple Tree", es: "Encastrado en Tija Mecanizada", fr: "Encastré dans le Té Supérieur Usiné" } },
      { key: "central_bracket", name: { pt: "Suporte Central Clássico no Guiador", en: "Classic Central Handlebar Bracket", es: "Soporte Central en Manillar", fr: "Support Central sur Guidon" } }
    ]
  },
  {
    key: "grips",
    order: 12,
    title: { pt: "Punhos", en: "Grips", es: "Puños", fr: "Poignées" },
    description: {
      pt: "Escolha os punhos na lista de acessórios, material/textura e cor a combinar com o assento",
      en: "Select the grips from the accessories list, material texture and color matched to the seat",
      es: "Seleccione los puños en la lista de accesorios, textura y color a juego con el asiento",
      fr: "Sélectionnez les poignées dans la liste d'accessoires, la texture et la couleur assortie à la selle"
    },
    accessoryLabel: { pt: "Acessório / Modelo de Punhos:", en: "Grips Accessory / Model:", es: "Accesorio / Modelo de Puños:", fr: "Accessoire / Modèle de Poignées :" },
    options: [
      { key: "brooks_leather_grips", brand: "Brooks England Leather", label: { pt: "Brooks England Leather — Punhos em Pele Natural a Combinar c/ o Assento", en: "Brooks England Leather — Natural Leather Grips Matched to Seat", es: "Brooks England Leather — Puños en Piel Natural a Juego con el Asiento", fr: "Brooks England Leather — Poignées Cuir Naturel Assorties à la Selle" } },
      { key: "biltwell_renegade_diamond", brand: "Biltwell", label: { pt: "Biltwell Renegade / Torker — Borracha Padrão Diamante de Alta Aderência", en: "Biltwell Renegade / Torker — High-Grip Diamond Pattern Rubber", es: "Biltwell Renegade / Torker — Goma Patrón Diamante", fr: "Biltwell Renegade / Torker — Caoutchouc Motif Losange" } },
      { key: "motogadget_mogrip_alu", brand: "Motogadget", label: { pt: "Motogadget mo.grip — Alumínio Billet Maquinado CNC / Soft Grip", en: "Motogadget mo.grip — CNC Billet Alloy / Soft Grip", es: "Motogadget mo.grip — Aluminio Mecanizado CNC", fr: "Motogadget mo.grip — Aluminium Taillé Masse CNC" } },
      { key: "domino_racing_silicone", brand: "Domino Racing", label: { pt: "Domino Racing A450 — Composto Silicone Desportivo Motorsport", en: "Domino Racing A450 — Motorsport Silicone Dual-Compound", es: "Domino Racing A450 — Compuesto Silicona Motorsport", fr: "Domino Racing A450 — Silicone Bi-Composant Motorsport" } },
      { key: "renthal_vintage_ribbed", brand: "Renthal", label: { pt: "Renthal Dual Compound — Borracha Canelada Clássica Vintage", en: "Renthal Dual Compound — Classic Ribbed Vintage Grip", es: "Renthal Dual Compound — Goma Estriada Clásica", fr: "Renthal Dual Compound — Caoutchouc Côtelé Vintage" } }
    ],
    spec1Label: { pt: "Cor / Acabamento dos Punhos:", en: "Grip Color / Finish:", es: "Color / Acabado de Puños:", fr: "Couleur / Finition des Poignées :" },
    spec1Options: [
      { key: "cognac_brown", name: { pt: "Castanho Conhaque (a combinar c/ pele)", en: "Cognac Brown (Matched to Leather)", es: "Marrón Coñac", fr: "Marron Cognac" } },
      { key: "deep_black", name: { pt: "Preto Profundo", en: "Deep Black", es: "Negro Profundo", fr: "Noir Profond" } },
      { key: "chocolate_vintage", name: { pt: "Castanho Chocolate Vintage", en: "Vintage Chocolate Brown", es: "Marrón Chocolate Vintage", fr: "Marron Chocolat Vintage" } }
    ]
  }
];
