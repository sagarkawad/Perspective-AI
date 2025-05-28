'use client';

import React from 'react';
import styled from 'styled-components';

interface DescCardProps {
  title: string;
  description: string;
}

const Card: React.FC<DescCardProps> = ({ title, description }) => {
  return (
    <StyledWrapper>
      <div className="card">
        <h2 className='card-title'>{title}</h2>
        <p className='card-description'>{description}</p>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .card {
    width: 100%;
    min-height: 200px;
    background-color: #fff;
    border-radius: 12px;
    padding: 24px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border: 1px solid #dfe6e9;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
  
  .card-title {
    color: #2d3436;
    font-size: 1.25rem;
    font-weight: 600;
    text-align: center;
    margin-bottom: 16px;
  }
  
  .card-description {
    color: #636e72;
    font-size: 0.95rem;
    text-align: center;
    line-height: 1.6;
  }
`;

export default Card;