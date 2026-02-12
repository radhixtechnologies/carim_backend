CREATE TABLE `sedad` (
  `id_facture` INT NOT NULL AUTO_INCREMENT  ,
  `payer_name` VARCHAR(255) NOT NULL DEFAULT '' 
  `payer_tel` VARCHAR(255) NOT NULL DEFAULT '' ,
  `payment_code` VARCHAR(255) NOT NULL DEFAULT ''  ,
  `socketId` VARCHAR(255) NOT NULL DEFAULT '',
  `num_recu` VARCHAR(255) NOT NULL DEFAULT '' ,
  `id_transaction` VARCHAR(255) NOT NULL DEFAULT ''  ,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id_facture`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




CREATE TABLE `bankily` (
  `operationId` INT NOT NULL AUTO_INCREMENT COMMENT 'Unique operation identifier for Bankily',
  `clientPhone` VARCHAR(255) NOT NULL DEFAULT '',
  `passcode` VARCHAR(255) NOT NULL DEFAULT '',
  `id_transaction` VARCHAR(255) NOT NULL DEFAULT '',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` DATETIME DEFAULT NULL,
  PRIMARY KEY (`operationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE `payments` (
  `id` INT NOT NULL AUTO_INCREMENT COMMENT 'Unique payment ID',
  `user_id` INT NOT NULL COMMENT 'Foreign key to users table',
  `amount` DOUBLE NOT NULL DEFAULT 0 COMMENT 'Payment amount',
  `date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date of payment',
  `status` ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending' COMMENT 'Payment status',
  `id_bankily` INT DEFAULT NULL COMMENT 'Foreign key to Bankily payment (if applicable)',
  `id_sedad` INT DEFAULT NULL COMMENT 'Foreign key to Sedad payment (if applicable)',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deletedAt` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_bankily` FOREIGN KEY (`id_bankily`) REFERENCES `bankily`(`operationId`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_sedad` FOREIGN KEY (`id_sedad`) REFERENCES `sedad`(`id_facture`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

