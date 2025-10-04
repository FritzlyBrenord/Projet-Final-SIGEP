"use client";

import React, { useState, useEffect } from "react";
import Select from "react-select";

type LocationOption = { value: string; label: string };

export default function LocationSelector() {
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [regions, setRegions] = useState<LocationOption[]>([]);
  const [cities, setCities] = useState<LocationOption[]>([]);
  const [sections, setSections] = useState<LocationOption[]>([]);

  const [pays, setPays] = useState<string>("");
  const [region, setRegion] = useState<string>("");
  const [ville, setVille] = useState<string>("");
  const [section, setSection] = useState<string>("");

  const username = "brenordfritzly";
  // Charger les pays depuis GeoNames (ou dataset local en français)
  useEffect(() => {
    fetch(
      `http://api.geonames.org/countryInfoJSON?username=${username}&lang=fr`
    )
      .then((res) => res.json())
      .then((data) => {
        const options = data.geonames.map((c: any) => ({
          value: c.geonameId,
          label: c.countryName,
        }));
        setCountries(options);
      });
  }, []);

  // Charger les régions après sélection du pays
  useEffect(() => {
    if (!pays) return;
    fetch(
      `http://api.geonames.org/childrenJSON?geonameId=${pays}&username=${username}&lang=fr`
    )
      .then((res) => res.json())
      .then((data) => {
        const options = data.geonames.map((r: any) => ({
          value: r.geonameId,
          label: r.name,
        }));
        setRegions(options);
        setCities([]);
        setSections([]);
      });
  }, [pays]);

  // Charger les villes/communes
  useEffect(() => {
    if (!region) return;
    fetch(
      `http://api.geonames.org/childrenJSON?geonameId=${region}&username=${username}&lang=fr`
    )
      .then((res) => res.json())
      .then((data) => {
        const options = data.geonames.map((v: any) => ({
          value: v.geonameId,
          label: v.name,
        }));
        setCities(options);
        setSections([]);
      });
  }, [region]);

  // Charger les sections communales
  useEffect(() => {
    if (!ville) return;
    fetch(
      `http://api.geonames.org/childrenJSON?geonameId=${ville}&username=${username}&lang=fr`
    )
      .then((res) => res.json())
      .then((data) => {
        const options = data.geonames.map((s: any) => ({
          value: s.geonameId,
          label: s.name,
        }));
        setSections(options);
      });
  }, [ville]);

  return (
    <div className="space-y-4 max-w-md mx-auto p-4">
      <Select
        options={countries}
        placeholder="Choisir un pays"
        onChange={(e) => setPays(e?.value || "")}
        isSearchable
      />
      <Select
        options={regions}
        placeholder="Choisir un département/état"
        onChange={(e) => setRegion(e?.value || "")}
        isSearchable
        isDisabled={!pays}
      />
      <Select
        options={cities}
        placeholder="Choisir une commune/ville"
        onChange={(e) => setVille(e?.value || "")}
        isSearchable
        isDisabled={!region}
      />
      <Select
        options={sections}
        placeholder="Choisir une section communale"
        onChange={(e) => setSection(e?.value || "")}
        isSearchable
        isDisabled={!ville}
      />

      <div className="mt-6 bg-gray-100 p-3 rounded-lg">
        <p>
          <strong>Pays :</strong> {pays}
        </p>
        <p>
          <strong>Région :</strong> {region}
        </p>
        <p>
          <strong>Ville :</strong> {ville}
        </p>
        <p>
          <strong>Section :</strong> {section}
        </p>
      </div>
    </div>
  );
}
