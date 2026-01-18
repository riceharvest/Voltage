
import { flavors, bases } from '../../data';
import { BaseRecipe, FlavorRecipe } from '../types';

export function getBases(): BaseRecipe[] {
  return bases;
}

export function getFlavors(): FlavorRecipe[] {
  return flavors;
}

export function getFlavorById(id: string): FlavorRecipe | undefined {
  return flavors.find(f => f.id === id);
}

export function getBaseById(id: string): BaseRecipe | undefined {
  return bases.find(b => b.id === id);
}
