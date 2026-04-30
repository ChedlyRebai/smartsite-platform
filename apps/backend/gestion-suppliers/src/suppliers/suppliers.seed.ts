import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier, SupplierDocument } from './entities/supplier.entity';

@Injectable()
export class SuppliersSeedService {
  private readonly logger = new Logger(SuppliersSeedService.name);

  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
  ) {}

  async seedSuppliers(): Promise<void> {
    const count = await this.supplierModel.countDocuments();
    if (count > 0) {
      this.logger.log('Fournisseurs déjà présents dans la base de données');
      return;
    }

    const suppliers = [
      {
        nom: 'BatiMat Tunisie',
        email: 'contact@batimat.tn',
        telephone: '+216 71 123 456',
        adresse: 'Zone Industrielle Ariana',
        ville: 'Ariana',
        codePostal: '2080',
        pays: 'Tunisie',
        siteWeb: 'https://batimat.tn',
        contactPrincipal: 'Ahmed Ben Ali',
        specialites: ['Ciment', 'Béton', 'Acier'],
        statut: 'actif',
        delaiLivraison: 3,
        evaluation: 4,
        notes: 'Fournisseur fiable pour les matériaux de construction',
        coordonnees: {
          latitude: 36.8625,
          longitude: 10.1958,
        },
        isActive: true,
      },
      {
        nom: 'Matériaux du Sud',
        email: 'info@materiauxsud.tn',
        telephone: '+216 74 987 654',
        adresse: 'Route de Gabès Km 5',
        ville: 'Sfax',
        codePostal: '3000',
        pays: 'Tunisie',
        siteWeb: 'https://materiauxsud.tn',
        contactPrincipal: 'Fatma Trabelsi',
        specialites: ['Peinture', 'Isolation', 'Carrelage'],
        statut: 'actif',
        delaiLivraison: 5,
        evaluation: 5,
        notes: 'Excellent service client et livraison rapide',
        coordonnees: {
          latitude: 34.7406,
          longitude: 10.7603,
        },
        isActive: true,
      },
      {
        nom: 'Construction Plus',
        email: 'commercial@constructionplus.tn',
        telephone: '+216 70 555 777',
        adresse: 'Avenue Habib Bourguiba',
        ville: 'Tunis',
        codePostal: '1000',
        pays: 'Tunisie',
        siteWeb: 'https://constructionplus.tn',
        contactPrincipal: 'Mohamed Gharbi',
        specialites: ['Électricité', 'Plomberie', 'Outillage'],
        statut: 'actif',
        delaiLivraison: 2,
        evaluation: 4,
        notes: 'Spécialisé dans les équipements techniques',
        coordonnees: {
          latitude: 36.8008,
          longitude: 10.1817,
        },
        isActive: true,
      },
      {
        nom: 'Ferro Métal',
        email: 'ventes@ferrometal.tn',
        telephone: '+216 72 444 888',
        adresse: 'Zone Industrielle Menzel Bourguiba',
        ville: 'Bizerte',
        codePostal: '7050',
        pays: 'Tunisie',
        contactPrincipal: 'Karim Sassi',
        specialites: ['Acier', 'Fer', 'Métallurgie'],
        statut: 'actif',
        delaiLivraison: 4,
        evaluation: 3,
        notes: 'Fournisseur de métaux et aciers de construction',
        coordonnees: {
          latitude: 37.2744,
          longitude: 9.8739,
        },
        isActive: true,
      },
      {
        nom: 'Eco Matériaux',
        email: 'contact@ecomateriaux.tn',
        telephone: '+216 73 333 999',
        adresse: 'Rue de la République',
        ville: 'Sousse',
        codePostal: '4000',
        pays: 'Tunisie',
        siteWeb: 'https://ecomateriaux.tn',
        contactPrincipal: 'Leila Mansouri',
        specialites: ['Matériaux écologiques', 'Isolation naturelle', 'Bois'],
        statut: 'actif',
        delaiLivraison: 6,
        evaluation: 5,
        notes: 'Spécialisé dans les matériaux écologiques et durables',
        coordonnees: {
          latitude: 35.8256,
          longitude: 10.6369,
        },
        isActive: true,
      },
    ];

    try {
      await this.supplierModel.insertMany(suppliers);
      this.logger.log(`${suppliers.length} fournisseurs créés avec succès`);
    } catch (error) {
      this.logger.error('Erreur lors de la création des fournisseurs:', error);
    }
  }
}