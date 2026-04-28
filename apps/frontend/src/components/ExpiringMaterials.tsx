import React, { useState, useEffect } from 'react';
import materialService, { Material } from '../services/materialService';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Badge,
} from '@mui/material';
import { Warning, Error as ErrorIcon, Info } from '@mui/icons-material';

interface ExpiringMaterial extends Material {
  daysRemaining: number;
  urgency: 'critical' | 'warning' | 'info';
}

const ExpiringMaterials: React.FC = () => {
  const [materials, setMaterials] = useState<ExpiringMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysFilter, setDaysFilter] = useState<number>(30);

  useEffect(() => {
    loadExpiringMaterials();
  }, [daysFilter]);

  const loadExpiringMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await materialService.getExpiringMaterials(daysFilter);
      
      // Calculer les jours restants et l'urgence
      const enrichedData: ExpiringMaterial[] = data.map((material) => {
        const expiryDate = new Date(material.expiryDate!);
        const today = new Date();
        const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let urgency: 'critical' | 'warning' | 'info' = 'info';
        if (daysRemaining <= 7) urgency = 'critical';
        else if (daysRemaining <= 15) urgency = 'warning';
        
        return {
          ...material,
          daysRemaining,
          urgency,
        };
      });
      
      setMaterials(enrichedData);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des matériaux expirants');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: 'critical' | 'warning' | 'info') => {
    switch (urgency) {
      case 'critical':
        return '#dc2626'; // Rouge
      case 'warning':
        return '#f59e0b'; // Orange
      case 'info':
        return '#fbbf24'; // Jaune
      default:
        return '#64748b';
    }
  };

  const getUrgencyIcon = (urgency: 'critical' | 'warning' | 'info') => {
    switch (urgency) {
      case 'critical':
        return <ErrorIcon fontSize="small" />;
      case 'warning':
        return <Warning fontSize="small" />;
      case 'info':
        return <Info fontSize="small" />;
    }
  };

  const getUrgencyLabel = (urgency: 'critical' | 'warning' | 'info') => {
    switch (urgency) {
      case 'critical':
        return 'Critique';
      case 'warning':
        return 'Attention';
      case 'info':
        return 'À surveiller';
    }
  };

  const handleDaysFilterChange = (_event: React.MouseEvent<HTMLElement>, newValue: number | null) => {
    if (newValue !== null) {
      setDaysFilter(newValue);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Matériaux Expirants
          </Typography>
          <Badge
            badgeContent={materials.length}
            color={materials.length > 0 ? 'error' : 'default'}
            sx={{ mt: 1 }}
          >
            <Chip
              label={`${materials.length} matériau${materials.length > 1 ? 'x' : ''} expire${materials.length > 1 ? 'nt' : ''} dans les ${daysFilter} prochains jours`}
              color={materials.length > 0 ? 'warning' : 'default'}
              icon={<Warning />}
            />
          </Badge>
        </Box>

        <ToggleButtonGroup
          value={daysFilter}
          exclusive
          onChange={handleDaysFilterChange}
          aria-label="filtre jours"
        >
          <ToggleButton value={7} aria-label="7 jours">
            7 jours
          </ToggleButton>
          <ToggleButton value={15} aria-label="15 jours">
            15 jours
          </ToggleButton>
          <ToggleButton value={30} aria-label="30 jours">
            30 jours
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {materials.length === 0 ? (
        <Alert severity="success">
          Aucun matériau n'expire dans les {daysFilter} prochains jours. 🎉
        </Alert>
      ) : (
        <Card>
          <CardContent>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Urgence</strong></TableCell>
                    <TableCell><strong>Nom</strong></TableCell>
                    <TableCell><strong>Code</strong></TableCell>
                    <TableCell><strong>Catégorie</strong></TableCell>
                    <TableCell align="right"><strong>Quantité</strong></TableCell>
                    <TableCell><strong>Date d'expiration</strong></TableCell>
                    <TableCell align="center"><strong>Jours restants</strong></TableCell>
                    <TableCell><strong>Site</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {materials.map((material) => (
                    <TableRow
                      key={material._id}
                      sx={{
                        backgroundColor: `${getUrgencyColor(material.urgency)}15`,
                        '&:hover': {
                          backgroundColor: `${getUrgencyColor(material.urgency)}25`,
                        },
                      }}
                    >
                      <TableCell>
                        <Chip
                          icon={getUrgencyIcon(material.urgency)}
                          label={getUrgencyLabel(material.urgency)}
                          size="small"
                          sx={{
                            backgroundColor: getUrgencyColor(material.urgency),
                            color: 'white',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {material.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {material.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{material.category}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {material.quantity} {material.unit}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(material.expiryDate!).toLocaleDateString('fr-FR')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${material.daysRemaining} jour${material.daysRemaining > 1 ? 's' : ''}`}
                          size="small"
                          color={
                            material.urgency === 'critical'
                              ? 'error'
                              : material.urgency === 'warning'
                              ? 'warning'
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {material.siteName || 'Non assigné'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ExpiringMaterials;
