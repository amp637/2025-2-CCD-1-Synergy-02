package com.synergy.bokja.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "effect_table")
public class EffectEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long efno;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String image;
}
