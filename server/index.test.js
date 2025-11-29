// server/index.test.js

const { generateRandomColors } = require('./index');

describe('Fonctions Utilitaires du Serveur', () => {
    
    test('generateRandomColors doit retourner exactement 4 couleurs', () => {
        const colors = generateRandomColors();
        // Vérifie que le tableau contient 4 éléments
        expect(colors.length).toBe(4);
    });

    test('generateRandomColors doit retourner des couleurs uniques (pas de doublons)', () => {
        const colors = generateRandomColors();
        // Utilise un Set pour vérifier que toutes les couleurs sont uniques
        const uniqueColors = new Set(colors);
        // Vérifie que le nombre d'éléments dans le Set est égal au nombre d'éléments dans le tableau
        expect(uniqueColors.size).toBe(4);
    });

    test('generateRandomColors doit retourner des chaînes de caractères HSL valides', () => {
        const colors = generateRandomColors();
        // Vérifie que chaque élément est une chaîne
        expect(typeof colors[0]).toBe('string');
        // Vérifie que chaque élément commence par "hsl(" (format attendu)
        colors.forEach(color => {
            expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
        });
    });
});