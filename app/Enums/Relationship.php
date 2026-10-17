<?php

namespace App\Enums;

/**
 * What the remembered person was to the memorial owner
 * (e.g. "parent" means the deceased was the owner's parent).
 */
enum Relationship: string
{
    case Parent = 'parent';
    case Grandparent = 'grandparent';
    case Spouse = 'spouse';
    case Partner = 'partner';
    case Child = 'child';
    case Sibling = 'sibling';
    case OtherFamily = 'other_family';
    case Friend = 'friend';
    case Colleague = 'colleague';
    case Other = 'other';
    case NoRelationship = 'no_relationship';
}
