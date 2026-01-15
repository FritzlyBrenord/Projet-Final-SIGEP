import React from "react";
import QRCode from "react-qr-code";

export interface BadgeConfig {
  // Couleurs
  headerBgColor: string;
  bodyBgColor: string;
  headerTextColor: string;
  nameTextColor: string;
  infoTextColor: string;
  footerBgColor: string;
  footerTextColor: string;

  // Options
  showLogo: boolean;
  customLogo: string;
  customSignature: string;
  showQRCode: boolean;

  // Style
  headerHeight: number;
  headerBorderWidth: number;
  headerBorderColor: string;
  headerBorderPositions: {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
  };
  headerRounded: string;

  // Background
  backgroundPattern: string;
  customBackground: string;
  selectedBackgroundImage: string;
  useBackgroundImage: boolean;
  useTransparentHeader: boolean;

  // Orientation
  orientation: "portrait" | "paysage";
  // Photo options
  photoWidthMm?: number;
  photoHeightMm?: number;
  photoBorderEnabled?: boolean;
  photoBorderWidth?: number; // in mm
  photoBorderColor?: string;
  photoBorderRadius?: number; // in mm
  photoBorderShape?: "square" | "rounded" | "pill" | "custom";
  // Photo background
  photoBackgroundColor?: string;
  photoBackgroundTransparent?: boolean;
  footerTransparent?: boolean;
}

export interface EleveData {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  photo_url?: string;
  classe_nom?: string;
  salle_nom?: string;
  groupe_sanguin?: string;
}

interface Props {
  config: BadgeConfig;
  eleve: EleveData;
  className?: string;
}

// Obtenir les couleurs de texte
const getCurrentTextColors = (config: BadgeConfig) => ({
  headerTextColor: config.headerTextColor,
  nameTextColor: config.nameTextColor,
  infoTextColor: config.infoTextColor,
});

const BadgeClassicCustomizable: React.FC<Props> = ({
  config,
  eleve,
  className = "",
}) => {
  // Helper pour afficher les noms de classe courts (ex: "7e Année Fondamentale" -> "7e A.F")
  const formatClassDisplay = (rawName?: string) => {
    if (!rawName) return rawName;
    const fondamentaleRegex = /^(\d+(?:er|ère|e))\s+Année\s+Fondamentale$/i;
    const m = rawName.match(fondamentaleRegex);
    if (m) return `${m[1]} A.F`;
    return rawName;
  };

  const displayClass = formatClassDisplay(eleve.classe_nom || "");
  // Obtenir le style de background selon le pattern sélectionné
  const getBackgroundStyle = () => {
    // Priorité 1: Image personnalisée uploadée
    if (config.customBackground) {
      return {
        backgroundImage: `url(${config.customBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }

    // Priorité 2: Image prédéfinie sélectionnée
    if (config.useBackgroundImage && config.selectedBackgroundImage) {
      return {
        backgroundImage: `url(${config.selectedBackgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }

    // Priorité 3: Pattern
    switch (config.backgroundPattern) {
      case "gradient1":
        return {
          background: `linear-gradient(135deg, ${config.bodyBgColor}33 0%, ${config.bodyBgColor}66 100%)`,
        };
      case "gradient2":
        return {
          background: `radial-gradient(circle at center, ${config.bodyBgColor}44 0%, ${config.bodyBgColor}88 100%)`,
        };
      case "gradient3":
        return {
          background: `linear-gradient(to bottom, ${config.bodyBgColor}33 0%, ${config.bodyBgColor}66 100%)`,
        };
      case "dots":
        return {
          backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          backgroundColor: config.bodyBgColor,
        };
      case "waves":
        return {
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)`,
          backgroundColor: config.bodyBgColor,
        };
      default:
        return { backgroundColor: config.bodyBgColor };
    }
  };

  // Obtenir le style de l'en-tête (transparent ou avec couleur)
  const getHeaderStyle = () => {
    const style: React.CSSProperties = {};

    if (config.useTransparentHeader) {
      // En-tête transparent - le background du parent sera visible
      style.backgroundColor = "transparent";
    } else {
      // En-tête avec couleur opaque
      style.backgroundColor = config.headerBgColor;
    }

    // Ajouter bordure si définie
    if (config.headerBorderWidth > 0) {
      const borderStyle = `${config.headerBorderWidth}px solid ${config.headerBorderColor}`;

      // Appliquer les bordures sélectionnées
      if (config.headerBorderPositions.top) {
        style.borderTop = borderStyle;
      }
      if (config.headerBorderPositions.bottom) {
        style.borderBottom = borderStyle;
      }
      if (config.headerBorderPositions.left) {
        style.borderLeft = borderStyle;
      }
      if (config.headerBorderPositions.right) {
        style.borderRight = borderStyle;
      }
    }

    return style;
  };

  // Obtenir la classe CSS pour l'arrondi de l'en-tête
  const getHeaderRoundedClass = () => {
    const roundedMap: { [key: string]: string } = {
      none: "",
      sm: "rounded-lg",
      md: "rounded-xl",
      lg: "rounded-2xl",
      full: "rounded-full",
    };
    return roundedMap[config.headerRounded] || "";
  };

  const currentHeaderTextColor = config.headerTextColor;
  const currentNameTextColor = config.nameTextColor;
  const currentInfoTextColor = config.infoTextColor;

  // Données pour le QR Code
  const qrValue = `${eleve.nom} ${eleve.prenom} - ${
    eleve.classe_nom || "N/A"
  } - ${eleve.code}`;

  return (
    <div
      className={`relative ${
        config.orientation === "portrait"
          ? " w-[54mm] h-[86mm] font-sans"
          : "w-[86mm] h-[54mm] font-sans"
      } shrink-0 rounded-[4mm] overflow-hidden font-sans`}
      style={getBackgroundStyle()}
    >
      {config.orientation === "portrait" ? (
        <div>
          {/* HEADER */}
          <div
            className={`rounded-t-[4mm] px-[2.5mm] py-[2mm] text-center relative ${
              config.useTransparentHeader ? "backdrop-blur-none" : ""
            } ${getHeaderRoundedClass()}`}
            style={{
              ...getHeaderStyle(),
              color: currentHeaderTextColor,
              height: `${config.headerHeight}%`,
            }}
          >
            {/* Logo en position absolue */}
            {config.showLogo && (
              <div
                className="absolute left-[2mm] top-[4mm]"
                style={{
                  width: "6mm", // largeur contrôlée
                }}
              >
                <img
                  src={config.customLogo || "/logo.png"}
                  alt="Logo"
                  crossOrigin="anonymous"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </div>
            )}

            <div className="leading-tight space-y-[0.3mm] ">
              <div className="text-[6pt] font-extrabold uppercase tracking-wide">
                Institution Mixte Faustin Première des Gonaïves
              </div>

              {/* Informations de contact */}
              <div className="text-[3.5pt] opacity-90 mt-[0.5mm] space-y-[0.2mm]">
                <div className="font-medium">
                  156, avenue des Dattes, Route Nationale #1
                </div>
                <div className="flex justify-center items-center gap-[2mm] font-medium">
                  <span>Tél: +509 3373 4336 / 3764 4223</span>
                  <span>•</span>
                  <span>info@uaf.ac.cd</span>
                </div>
              </div>
            </div>
          </div>

          {/* PHOTO */}
          <div
            className="absolute left-1/2 -translate-x-1/2 overflow-hidden"
            style={{
              width: `${config.photoWidthMm ?? 22}mm`,
              height: `${config.photoHeightMm ?? 25}mm`,
              border: config.photoBorderEnabled
                ? `${config.photoBorderWidth ?? 0.4}mm solid ${
                    config.photoBorderColor || config.headerBgColor
                  }`
                : "none",
              borderRadius:
                config.photoBorderShape === "pill"
                  ? "50%"
                  : config.photoBorderShape === "square"
                  ? "0"
                  : config.photoBorderShape === "rounded"
                  ? "4mm"
                  : `${config.photoBorderRadius ?? 0}mm`,
              background:
                config.photoBackgroundTransparent === true
                  ? "transparent"
                  : config.photoBackgroundColor || "rgba(255,255,255,0.7)",
              top: `calc(${config.headerHeight}% + 3mm)`,
            }}
          >
            <img
              src={eleve.photo_url || "/image.png"}
              alt="Photo étudiant"
              className="w-full h-auto object-cover"
              style={{ display: "block" }}
            />
          </div>

          {/* NOM */}
          <div
            className="absolute left-0 right-0 text-center font-bold text-[10pt] leading-tight px-[2mm] uppercase"
            style={{
              color: currentNameTextColor,
              top: `calc(${config.headerHeight}% + 31mm)`,
            }}
          >
            {eleve?.nom || ""} {eleve?.prenom || ""}
          </div>

          {/* INFOS */}
          <div
            className="absolute left-[6mm] right-[6mm] text-[5pt] space-y-[1mm]"
            style={{
              color: currentInfoTextColor,
              top: `calc(${config.headerHeight}% + 38mm)`,
            }}
          >
            <div className="flex">
              <div className="w-[14mm] font-medium">MATRICULE:</div>
              <div className="font-semibold">{eleve.code}</div>
            </div>
            <div className="flex">
              <div className="w-[14mm] font-medium">Classe:</div>
              <div className="font-semibold">{displayClass || "N/A"}</div>
            </div>
            <div className="flex">
              <div className="w-[14mm] font-medium">Salle:</div>
              <div className="font-semibold">{eleve.salle_nom || "N/A"}</div>
            </div>
            <div className="flex">
              <div className="w-[14mm] font-medium">G.S:</div>
              <div className="font-semibold">
                {eleve.groupe_sanguin || "N/A"}
              </div>
            </div>
            <div className="flex">
              <div className="w-[14mm] font-medium">VACATION:</div>
              <div className="font-semibold">AM</div>
            </div>
          </div>

          {/* ANNÉE */}

          {config.showQRCode ? (
            <div className="absolute bottom-14 right-3 p-[1mm] bg-white border-[0.3mm] border-gray-300">
              <div style={{ height: "10mm", width: "10mm" }}>
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={qrValue}
                  viewBox={`0 0 256 256`}
                />
              </div>
            </div>
          ) : (
            <div className="absolute bottom-14 right-3 w-[12mm] h-[12mm]"></div>
          )}
          {/* SIGNATURE */}
          <div
            className="absolute bottom-[7mm] right-[6mm] w-[20mm] text-center text-[4pt]"
            style={{ color: currentInfoTextColor, opacity: 0.7 }}
          >
            {/* Image de signature calligraphique */}
            <div className="h-[6mm] flex items-center justify-center mb-[0.5mm]">
              <img
                src={config.customSignature || ""}
                alt="s"
                crossOrigin="anonymous"
                className="max-w-full max-h-full object-contain block"
              />
            </div>
            <div
              className="border-t mb-[1mm]"
              style={{ borderColor: currentInfoTextColor }}
            />
            Direction Académique
          </div>

          {/* ID */}
          <div
            className="absolute bottom-[4mm] left-[6mm] text-[4pt] font-semibold"
            style={{ color: currentNameTextColor }}
          >
            ID: {eleve.code}
          </div>

          {/* FOOTER */}
          <div
            className="absolute left-0 right-0 text-center w-full"
            style={{
              // Fixed footer height to ensure consistent layout during canvas/pdf rendering
              height: "4mm",
              lineHeight: "4mm",
              bottom: "0",
              backgroundColor: config.footerTransparent
                ? "transparent"
                : config.footerBgColor || "rgba(0,0,0,0.05)",
              color: config.footerTextColor || currentInfoTextColor,
              fontSize: "3pt",
              fontWeight: 600,
              padding: 0,
              boxSizing: "border-box",
            }}
          >
            Cette carte est la propriété de l&apos;IMFP
          </div>
        </div>
      ) : (
        <>
          {/* Mode PAYSAGE */}
          {/* HEADER - En haut comme dans le modèle */}
          <div
            className={`rounded-t-[4mm] px-[3mm] py-[1.5mm] relative ${
              config.useTransparentHeader ? "backdrop-blur-none" : ""
            } ${getHeaderRoundedClass()}`}
            style={{
              ...getHeaderStyle(),
              color: currentHeaderTextColor,
              height: `${config.headerHeight}%`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Logo en position absolue */}
            {config.showLogo && (
              <div
                className="absolute left-[3mm] top-1/2 -translate-y-1/2"
                style={{
                  width: "8mm", // Ajusté pour le paysage
                }}
              >
                <img
                  src={config.customLogo || "/logo.png"}
                  alt="Logo"
                  crossOrigin="anonymous"
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                  }}
                />
              </div>
            )}

            {/* Texte centré et arrangé professionnellement */}
            <div
              className={`text-center flex flex-col items-center justify-center w-full ${
                config.showLogo ? "pl-[10mm]" : ""
              }`}
            >
              <div className="text-[6pt] font-extrabold uppercase tracking-wide leading-tight mb-[0.5mm]">
                Institution Mixte Faustin Première des Gonaïves
              </div>
              <div className="text-[4pt] font-medium opacity-90 leading-tight">
                156, avenue des Dattes, Route Nationale #1
              </div>
              <div className="text-[4pt] opacity-90 leading-tight mt-[0.2mm]">
                Tél: +509 3373 4336 / 3764 4223
              </div>
            </div>
          </div>

          {/* CONTENU PRINCIPAL */}
          <div
            className="absolute left-0 right-0 bottom-0 p-[3mm] flex gap-[3mm]"
            style={{ top: `${config.headerHeight}%` }}
          >
            {/* Section gauche - Photo */}
            <div className="flex flex-col items-center justify-center">
              <div
                style={{
                  width: `${config.photoWidthMm ?? 22}mm`,
                  height: `${config.photoHeightMm ?? 28}mm`,
                  border: config.photoBorderEnabled
                    ? `${config.photoBorderWidth ?? 0.4}mm solid ${
                        config.photoBorderColor || config.headerBgColor
                      }`
                    : "none",
                  background:
                    config.photoBackgroundTransparent === true
                      ? "transparent"
                      : config.photoBackgroundColor || "rgba(255,255,255,0.7)",
                  borderRadius:
                    config.photoBorderShape === "pill"
                      ? "50%"
                      : config.photoBorderShape === "square"
                      ? "0"
                      : config.photoBorderShape === "rounded"
                      ? "4mm"
                      : `${config.photoBorderRadius ?? 0}mm`,
                }}
                className="overflow-hidden"
              >
                <img
                  src={eleve.photo_url || "/image.png"}
                  alt="Photo étudiant"
                  className="w-full h-auto object-cover"
                  style={{ display: "block" }}
                />
              </div>
            </div>

            {/* Section centrale - Informations */}
            <div className="flex-1 flex flex-col justify-center text-[5pt] space-y-[1.2mm] pt-2">
              <div
                className="text-[7pt] font-extrabold mb-[1.5mm] uppercase tracking-tight border-b pb-[0.5mm]"
                style={{
                  color: currentNameTextColor,
                  borderColor: `${currentNameTextColor}40`,
                }}
              >
                {eleve?.nom || ""} {eleve?.prenom || ""}
              </div>

              <div
                style={{ color: currentInfoTextColor }}
                className="space-y-[1mm]"
              >
                <div className="flex items-baseline">
                  <div className="w-[18mm] font-bold opacity-70 text-[4.5pt] uppercase">
                    MATRICULE
                  </div>
                  <div className="font-bold text-[5.5pt]">{eleve.code}</div>
                </div>
                <div className="flex items-baseline">
                  <div className="w-[18mm] font-bold opacity-70 text-[4.5pt] uppercase">
                    CLASSE
                  </div>
                  <div className="font-bold text-[5.5pt]">
                    {formatClassDisplay(eleve.classe_nom) || "N/A"}
                  </div>
                </div>
                <div className="flex items-baseline">
                  <div className="w-[18mm] font-bold opacity-70 text-[4.5pt] uppercase">
                    SALLE
                  </div>
                  <div className="font-bold text-[5.5pt]">
                    {eleve.salle_nom || "N/A"}
                  </div>
                </div>
                <div className="flex items-baseline">
                  <div className="w-[18mm] font-bold opacity-70 text-[4.5pt] uppercase">
                    G.S
                  </div>
                  <div className="font-bold text-[5.5pt]">
                    {eleve.groupe_sanguin || "N/A"}
                  </div>
                </div>
                <div className="flex items-baseline">
                  <div className="w-[18mm] font-bold opacity-70 text-[4.5pt] uppercase">
                    VACATION
                  </div>
                  <div className="font-bold text-[5.5pt]">AM</div>
                </div>
              </div>
            </div>

            {/* Section droite - QR Code et signature */}
            <div className="flex flex-col items-center justify-between py-[1mm] w-[22mm]">
              {config.showQRCode ? (
                <div className="bg-white border-[0.3mm] border-gray-300 p-[1mm]">
                  <div style={{ height: "13mm", width: "13mm" }}>
                    <QRCode
                      size={256}
                      style={{
                        height: "auto",
                        maxWidth: "100%",
                        width: "100%",
                      }}
                      value={qrValue}
                      viewBox={`0 0 256 256`}
                    />
                  </div>
                </div>
              ) : (
                <div className="w-[15mm] h-[15mm]"></div>
              )}

              <div className="text-center">
                {/* Image de signature calligraphique */}
                <div className="h-[6mm] flex items-center justify-center mb-[0.5mm]">
                  <img
                    src={config.customSignature || ""}
                    alt="s"
                    className=" w-auto object-contain opacity-70"
                    crossOrigin="anonymous"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
                <div
                  className="border-t w-[18mm] mb-[1mm]"
                  style={{ borderColor: currentInfoTextColor }}
                ></div>
                <div
                  className="text-[4pt] font-semibold"
                  style={{ color: currentNameTextColor }}
                >
                  Direction Académique
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div
            className="absolute left-0 right-0 text-center w-full"
            style={{
              height: "4mm",
              lineHeight: "4mm",
              bottom: "0",
              backgroundColor: config.footerTransparent
                ? "transparent"
                : config.footerBgColor || "rgba(0,0,0,0.05)",
              color: config.footerTextColor || currentInfoTextColor,
              fontSize: "3pt",
              fontWeight: 600,
              padding: 0,
              boxSizing: "border-box",
            }}
          >
            Cette carte est la propriété de l&apos;IMFP • Trouvée, prière de la
            rapporter à l&apos;adresse ci-dessus.
          </div>
        </>
      )}
    </div>
  );
};

export default BadgeClassicCustomizable;
